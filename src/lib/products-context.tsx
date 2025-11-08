'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { addDynamicPlaceholder, removeDynamicPlaceholders, PlaceHolderImages } from './placeholder-images';
import { createSlug } from './utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';

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

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: fetchedProducts, isLoading } = useCollection<Omit<Product, 'id'>>(productsQuery);
  const products = useMemo(() => fetchedProducts || [], [fetchedProducts]);

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
  }, [products, PlaceHolderImages]);

  const inStockProducts = useMemo(
    () => enrichedProducts.filter((p) => Number(p.stock) > 0),
    [enrichedProducts]
  );

  const categories = useMemo(() => {
    if (isLoading) return [];
    const publicFacingProducts = enrichedProducts.filter((p) => Number(p.stock) > 0);
    return Array.from(
      new Set(
        publicFacingProducts
          .map((p) => p.category.split(' > ').pop()!)
          .filter(Boolean)
      )
    ).sort();
  }, [enrichedProducts, isLoading]);

  const allCategories = useMemo(() => {
    if (isLoading) return [];
    const publicFacingProducts = enrichedProducts.filter((p) => Number(p.stock) > 0);
    return Array.from(
      new Set(publicFacingProducts.map((p) => p.category).filter(Boolean))
    ).sort();
  }, [enrichedProducts, isLoading]);

  const addProducts = async (
    newProducts: Omit<Product, 'slug' | 'imageId'>[],
    newImagesData?: { id: string; url: string; hint: string; productId: string }[]
  ) => {
    if (!firestore) return;

    if (newImagesData) {
      const allPlaceholdersToAdd = newImagesData.map((img) => ({
        id: img.id,
        imageUrl: img.url,
        description: img.hint,
        imageHint: img.hint,
      }));
      addDynamicPlaceholder(allPlaceholdersToAdd);
    }
    
    const batch = writeBatch(firestore);

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

        batch.set(productRef, productData, { merge: true });
    });

    await batch.commit();
  };

  const deleteProducts = async (productIds: string[]) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);
    let imageIdsToDelete: string[] = [];

    productIds.forEach(productId => {
      const productRef = doc(firestore, 'products', productId);
      batch.delete(productRef);
      
      const productNumId = productId.replace('prod-', '');
      const placeholdersForProduct = PlaceHolderImages.filter(
        (img) => img.id && img.id.startsWith(`prod-img-${productNumId}-`)
      );
      imageIdsToDelete.push(...placeholdersForProduct.map(img => img.id));
      
      const product = products.find(p => p.id === productId);
      if (product?.imageId && !imageIdsToDelete.includes(product.imageId)) {
          imageIdsToDelete.push(product.imageId);
      }
    });

    await batch.commit();

    if (imageIdsToDelete.length > 0) {
      const uniqueImageIds = Array.from(new Set(imageIdsToDelete));
      removeDynamicPlaceholders(uniqueImageIds);
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products: inStockProducts,
        adminProducts: enrichedProducts,
        addProducts,
        deleteProducts,
        isLoaded: !isLoading,
        categories,
        allCategories,
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
