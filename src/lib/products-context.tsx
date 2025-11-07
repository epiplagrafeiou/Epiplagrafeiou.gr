
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { products as initialProducts, type Product } from './data';
import { addDynamicPlaceholder } from './placeholder-images';

interface ProductsContextType {
  products: Product[];
  addProducts: (newProducts: Omit<Product, 'id' | 'slug'>[], newImages?: { id: string; url: string; hint: string }[]) => void;
  deleteProducts: (productIds: string[]) => void;
  isLoaded: boolean;
  categories: string[];
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      const parsedProducts: Product[] = JSON.parse(storedProducts);
      setProducts(parsedProducts);

      const uniqueCategories = Array.from(new Set(parsedProducts.map(p => p.category.split(' > ').pop()!).filter(Boolean)));
      setCategories(uniqueCategories);
    } else {
        setProducts(initialProducts);
        const uniqueCategories = Array.from(new Set(initialProducts.map(p => p.category.split(' > ').pop()!).filter(Boolean)));
        setCategories(uniqueCategories);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('products', JSON.stringify(products));
      const uniqueCategories = Array.from(new Set(products.map(p => p.category.split(' > ').pop()!).filter(Boolean)));
      setCategories(uniqueCategories);
    }
  }, [products, isLoaded]);

  const addProducts = (newProducts: Omit<Product, 'id' | 'slug'>[], newImages?: { id: string; url: string; hint: string }[]) => {

    if (newImages) {
        addDynamicPlaceholder(newImages.map(img => ({
            id: img.id,
            imageUrl: img.url,
            description: img.hint,
            imageHint: img.hint,
        })));
    }

    setProducts((prevProducts) => {
      const productsToAdd = newProducts.map((p, index) => ({
        ...p,
        id: `prod-${Date.now()}-${index}`,
        slug: createSlug(p.name),
        imageId: p.images?.[0] ? `prod-img-${p.images[0].split('/').pop()}` : `temp-id-${Math.random()}`
      }));

      // A simple way to avoid duplicates by checking the name
      const uniqueNewProducts = productsToAdd.filter(
        newProd => !prevProducts.some(existingProd => existingProd.name === newProd.name)
      );

      return [...prevProducts, ...uniqueNewProducts];
    });
  };

  const deleteProducts = (productIds: string[]) => {
    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
  };

  return (
    <ProductsContext.Provider value={{ products, addProducts, deleteProducts, isLoaded, categories }}>
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
