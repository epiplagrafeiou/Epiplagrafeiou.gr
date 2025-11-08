
'use client';

import { createContext, useContext, useMemo } from 'react';
import { createSlug } from './utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';

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
    newProducts: Omit<Product, 'slug' | 'imageId'>[],
    newImagesData?: { id: string; url: string; hint: string; productId: string }[]
  ) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);
    const productBatchData: { path: string, data: any }[] = [];

    newProducts.forEach((p) => {
        const productId = `prod-${p.id}`;
        const productRef = doc(firestore, 'products', productId);
        const productSlug = createSlug(p.name);
        
        let imageId: string;
        const mainImageInfo = newImagesData?.find(
          (img) => img.productId === p.id && img.url === (p as any).mainImage
        );

        if (mainImageInfo) {
          imageId = mainImageInfo.id;
        } else {
          const anyImageInfo = newImagesData?.find((img) => img.productId === p.id);
          imageId = anyImageInfo?.id || `prod-fallback-${p.id}`;
        }
        
        const productData = {
          ...p,
          slug: productSlug,
          imageId: imageId,
          price: p.price,
          category: p.category,
          description: p.description,
          stock: Number(p.stock) || 0,
        };
        
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

  return (
    <ProductsContext.Provider
      value={{
        products: products,
        adminProducts: products,
        addProducts,
        deleteProducts,
        isLoaded: !isLoading,
        categories: [],
        allCategories: [],
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
