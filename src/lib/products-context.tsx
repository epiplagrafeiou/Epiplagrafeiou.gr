
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { products as initialProducts, type Product } from './data';

interface ProductsContextType {
  products: Product[];
  addProducts: (newProducts: Omit<Product, 'id' | 'slug'>[]) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Helper to create a URL-friendly slug
const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
};


export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(initialProducts);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isClient]);

  const addProducts = (newProducts: Omit<Product, 'id' | 'slug'>[]) => {
    setProducts((prevProducts) => {
      const productsToAdd = newProducts.map((p, index) => ({
        ...p,
        id: `prod-${Date.now()}-${index}`,
        slug: createSlug(p.name),
        // A default imageId if one is not provided.
        imageId: p.imageId || 'scandinavian-chair'
      }));

      // A simple way to avoid duplicates by checking the name
      const uniqueNewProducts = productsToAdd.filter(
        newProd => !prevProducts.some(existingProd => existingProd.name === newProd.name)
      );

      return [...prevProducts, ...uniqueNewProducts];
    });
  };

  return (
    <ProductsContext.Provider value={{ products, addProducts }}>
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
