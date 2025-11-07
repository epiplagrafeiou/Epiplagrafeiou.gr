
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { products as initialProducts, type Product } from './data';
import { addDynamicPlaceholder } from './placeholder-images';

interface ProductsContextType {
  products: Product[];
  addProducts: (newProducts: Omit<Product, 'id' | 'slug' | 'imageId'>[], newImages?: { id: string; url: string; hint: string }[]) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Helper to create a URL-friendly slug that supports Greek characters
const createSlug = (name: string) => {
  const greekChars: { [key: string]: string } = {
    'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th',
    'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
    'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps',
    'ω': 'o', 'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o',
  };

  return name
    .toLowerCase()
    .split('')
    .map(char => greekChars[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // Remove remaining special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
};


export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isClient]);

  const addProducts = (newProducts: Omit<Product, 'id' | 'slug'>[], newImages?: { id: string; url: string; hint: string }[]) => {

    if (newImages) {
        newImages.forEach(img => addDynamicPlaceholder({
            id: img.id,
            imageUrl: img.url,
            description: img.hint,
            imageHint: img.hint,
        }));
    }

    setProducts((prevProducts) => {
      const productsToAdd = newProducts.map((p, index) => ({
        ...p,
        id: `prod-${Date.now()}-${index}`,
        slug: createSlug(p.name),
        // The imageId is now expected to be passed in from the import process
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
