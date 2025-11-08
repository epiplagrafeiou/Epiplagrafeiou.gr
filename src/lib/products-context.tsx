
'use client';

import { createContext, useContext, useMemo } from 'react';
import { createSlug } from './utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import placeholderData from './placeholder-images.json';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  imageId: string; // This is now the URL of the main image
  category: string;
  images?: string[];
  stock?: number;
  supplierId: string;
}

interface ProductsContextType {
  products: Product[];
  adminProducts: Product[];
  addProducts: (
    newProducts: Omit<Product, 'slug' | 'imageId' | 'id' | 'supplierId'>[] & { id: string; supplierId: string, images: string[], mainImage: string | null }[],
  ) => void;
  deleteProducts: (productIds: string[]) => void;
  isLoaded: boolean;
  categories: string[];
  allCategories: string[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: fetchedProducts, isLoading } = useCollection<Omit<Product, 'id'>>(productsQuery);
  const products = useMemo(() => fetchedProducts || [], [fetchedProducts]);

  const addProducts = async (
    newProducts: (Omit<Product, 'slug' | 'imageId'> & { mainImage?: string | null, images: string[] })[],
  ) => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const productBatchData: { path: string; data: any }[] = [];

    newProducts.forEach((p) => {
        const productId = p.id;
        const productRef = doc(firestore, 'products', productId);
        const productSlug = createSlug(p.name);
        
        const sortedImages = [...(p.images || [])];
        if (p.mainImage) {
            const mainImageIndex = sortedImages.indexOf(p.mainImage);
            if (mainImageIndex > 0) {
                [sortedImages[0], sortedImages[mainImageIndex]] = [sortedImages[mainImageIndex], sortedImages[0]];
            } else if (mainImageIndex === -1) {
                sortedImages.unshift(p.mainImage);
            }
        }
        
        const imageId = sortedImages[0] || '';
        
        const productData = {
          ...p,
          id: productId,
          slug: productSlug,
          imageId: imageId,
          images: sortedImages,
          price: p.price,
          category: p.category,
          description: p.description,
          stock: Number(p.stock) || 0,
        };
        
        delete (productData as any).mainImage;

        productBatchData.push({ path: productRef.path, data: productData });
        batch.set(productRef, productData, { merge: true });
    });

    batch.commit().catch(error => {
       productBatchData.forEach(item => {
         const permissionError = new FirestorePermissionError({
           path: item.path,
           operation: 'create',
           requestResourceData: item.data,
         });
         errorEmitter.emit('permission-error', permissionError);
       });
    });
  };

  const deleteProducts = async (productIds: string[]) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    productIds.forEach(productId => {
      const productRef = doc(firestore, 'products', productId);
      batch.delete(productRef);
    });

    batch.commit().catch(error => {
        productIds.forEach(productId => {
            const permissionError = new FirestorePermissionError({
                path: `products/${productId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    });
  };

  const allProducts = useMemo(() => {
    return products.map((p) => {
        const allImageUrls = p.images || [];
        const mainImage = p.imageId || allImageUrls[0] || '';
        const sortedImages = mainImage
            ? [mainImage, ...allImageUrls.filter(url => url !== mainImage)]
            : allImageUrls;

        return {
            ...p,
            imageId: mainImage,
            images: Array.from(new Set(sortedImages)).filter(Boolean)
        };
    });
  }, [products]);

  const categories = useMemo(() => {
    const publicFacingProducts = allProducts.filter((p) => (p.stock ?? 0) > 0);
    return Array.from(
      new Set(
        publicFacingProducts
          .map((p) => p.category.split(' > ').pop()!)
          .filter(Boolean)
      )
    ).sort();
  }, [allProducts]);
  
  const allCategories = useMemo(() => {
    const publicFacingProducts = allProducts.filter((p) => (p.stock ?? 0) > 0);
    return Array.from(
      new Set(publicFacingProducts.map((p) => p.category).filter(Boolean))
    ).sort();
  }, [allProducts]);

  return (
    <ProductsContext.Provider
      value={{
        products: allProducts.filter(p => (p.stock ?? 0) > 0),
        adminProducts: allProducts,
        addProducts,
        deleteProducts,
        isLoaded: !isLoading,
        categories: categories,
        allCategories: allCategories,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
