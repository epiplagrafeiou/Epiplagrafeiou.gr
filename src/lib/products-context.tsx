
'use client';

import { createContext, useContext, useMemo } from 'react';
import { createSlug } from './utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { PlaceHolderImages } from './placeholder-images';


export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageId: string; 
  categoryId: string | null;
  rawCategory?: string;
  images?: string[];
  stock?: number;
  supplierId: string;
  category: string; // This is now the final, mapped category path
  variantGroupKey?: string;
  color?: string;
  sku?: string;
  model?: string;
}

interface ProductsContextType {
  products: Product[];
  adminProducts: Product[];
  addProducts: (
    newProducts: (Partial<Omit<Product, 'slug' | 'imageId'>> & { id: string; supplierId: string; images: string[]; mainImage?: string | null; name: string; price: number; category: string; description: string; stock: number; categoryId: string | null; })[]
  ) => Promise<void>;
  updateProduct: (product: Product) => void;
  deleteProducts: (productIds: string[]) => void;
  isLoaded: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: fetchedProducts, isLoading } = useCollection<Omit<Product, 'id'>>(productsQuery);
  
  const products = useMemo(() => {
    const combined = [...(fetchedProducts || [])];
    const uniqueProducts = Array.from(new Map(combined.map(p => [p.id, p])).values());
    return uniqueProducts;
  }, [fetchedProducts]);
  
  const resolveImageUrl = (idOrUrl: string | undefined): string => {
    if (!idOrUrl) return '';
    if (idOrUrl.startsWith('http') || idOrUrl.startsWith('/')) return idOrUrl;
    const found = PlaceHolderImages.find((img) => img.id === idOrUrl);
    return found?.imageUrl || '';
  };

  const addProducts = async (
    newProducts: (Omit<Product, 'slug' | 'imageId'> & { mainImage?: string | null, images: string[], category: string, categoryId: string | null })[],
  ): Promise<void> => {
    if (!firestore) return Promise.reject(new Error("Firestore not available"));

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
          categoryId: p.categoryId,
          description: p.description,
          stock: Number(p.stock) || 0,
        };
        
        delete (productData as any).mainImage;

        productBatchData.push({ path: productRef.path, data: productData });
        batch.set(productRef, productData, { merge: true });
    });

    return batch.commit().catch(error => {
       productBatchData.forEach(item => {
         const permissionError = new FirestorePermissionError({
           path: item.path,
           operation: 'create',
           requestResourceData: item.data,
         });
         errorEmitter.emit('permission-error', permissionError);
       });
       // Re-throw the error to be caught by the caller
       throw error;
    });
  };
  
  const updateProduct = async (product: Product) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'products', product.id);
    const { id, ...productData } = product;

    updateDoc(productRef, {...productData, category: productData.category }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: productRef.path,
            operation: 'update',
            requestResourceData: productData,
        });
        errorEmitter.emit('permission-error', permissionError);
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
        const mainImageUrl = resolveImageUrl(p.imageId);
        const allImageUrls = (p.images || []).map(resolveImageUrl);

        return {
            ...p,
            imageId: mainImageUrl,
            images: Array.from(new Set([mainImageUrl, ...allImageUrls])).filter(Boolean),
        };
    });
  }, [products]);


  return (
    <ProductsContext.Provider
      value={{
        products: allProducts.filter(p => (p.stock ?? 0) > 0),
        adminProducts: allProducts,
        addProducts,
        updateProduct,
        deleteProducts,
        isLoaded: !isLoading,
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
