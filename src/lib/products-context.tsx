
'use client';

import { createContext, useContext, useMemo } from 'react';
import { createSlug } from './utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { PlaceHolderImages } from './placeholder-images';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  imageId: string;
  category: string;
  images?: string[];
  stock?: number;
  supplierId: string;
}

interface ProductsContextType {
  products: Product[];
  adminProducts: Product[];
  addProducts: (
    newProducts: Omit<Product, 'slug' | 'imageId' | 'id' | 'supplierId'>[] & { id: string; supplierId: string }[],
    newImages?: { id: string; url: string; hint: string; productId: string }[]
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
    newProducts: (Omit<Product, 'slug' | 'imageId'> & { mainImage?: string })[],
    newImagesData?: { id: string; url: string; hint: string; productId: string }[]
  ) => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const productBatchData: { path: string; data: any }[] = [];

    newProducts.forEach((p) => {
        const productId = `prod-${p.id}`;
        const productRef = doc(firestore, 'products', productId);
        const productSlug = createSlug(p.name);
        
        // Find the placeholder info for the main image designated by the XML feed
        const mainImageInfo = newImagesData?.find(
          (img) => img.productId === p.id && img.url === p.mainImage
        );

        // Find any image if the main one isn't available for some reason
        const anyImageInfo = newImagesData?.find((img) => img.productId === p.id);
        
        // The imageId for the product MUST be the placeholder's unique ID, not the URL.
        const imageId = mainImageInfo?.id || anyImageInfo?.id || `prod-fallback-${p.id}`;
        
        const productData = {
          ...p,
          id: productId, // Ensure the final product ID is set
          slug: productSlug,
          imageId: imageId, // Assign the correct placeholder ID
          price: p.price,
          category: p.category,
          description: p.description,
          stock: Number(p.stock) || 0,
        };
        
        // Remove temporary fields before saving
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

  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const productNumId = p.id.replace('prod-', '');
      const imagePlaceholders = PlaceHolderImages.filter(
        (img) => img.id && img.id.startsWith(`prod-img-${productNumId}-`)
      );

      let allImageUrls = imagePlaceholders.map((img) => img.imageUrl);

      const mainImage = PlaceHolderImages.find((img) => img.id === p.imageId);
      if (mainImage) {
        allImageUrls = [
          mainImage.imageUrl,
          ...allImageUrls.filter((url) => url !== mainImage.imageUrl),
        ];
      }

      return {
        ...p,
        images: Array.from(new Set(allImageUrls)),
      };
    });
  }, [products]);

  const categories = useMemo(() => {
    const publicFacingProducts = enrichedProducts.filter((p) => (p.stock ?? 0) > 0);
    return Array.from(
      new Set(
        publicFacingProducts
          .map((p) => p.category.split(' > ').pop()!)
          .filter(Boolean)
      )
    ).sort();
  }, [enrichedProducts]);
  
  const allCategories = useMemo(() => {
    const publicFacingProducts = enrichedProducts.filter((p) => (p.stock ?? 0) > 0);
    return Array.from(
      new Set(publicFacingProducts.map((p) => p.category).filter(Boolean))
    ).sort();
  }, [enrichedProducts]);

  return (
    <ProductsContext.Provider
      value={{
        products: enrichedProducts.filter(p => (p.stock ?? 0) > 0),
        adminProducts: enrichedProducts,
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
