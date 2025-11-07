
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { products as initialProducts, type Product } from './data';
import { addDynamicPlaceholder } from './placeholder-images';
import { createSlug } from './utils';

interface ProductsContextType {
  products: Product[];
  addProducts: (newProducts: Omit<Product, 'id' | 'slug' | 'imageId'>[], newImages?: { id: string; url: string; hint: string, productId: string }[]) => void;
  deleteProducts: (productIds: string[]) => void;
  isLoaded: boolean;
  categories: string[];
  allCategories: string[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      const parsedProducts: Product[] = JSON.parse(storedProducts);
      setProducts(parsedProducts);
    } else {
        setProducts(initialProducts);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isLoaded]);

  const categories = useMemo(() => {
    if (!isLoaded) return [];
    return Array.from(new Set(products.map(p => p.category.split(' > ').pop()!).filter(Boolean))).sort();
  }, [products, isLoaded]);
  
  const allCategories = useMemo(() => {
    if (!isLoaded) return [];
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
  }, [products, isLoaded]);

  const addProducts = (newProducts: Omit<Product, 'id' | 'slug' | 'imageId'>[], newImages?: { id: string; url: string; hint: string, productId: string }[]) => {

    if (newImages) {
        addDynamicPlaceholder(newImages.map(img => ({
            id: img.id,
            imageUrl: img.url,
            description: img.hint,
            imageHint: img.hint,
        })));
    }

    setProducts((prevProducts) => {
      const productsToAdd = newProducts.map((p, index) => {
        const productId = `prod-${Date.now()}-${index}`;
        const productSlug = createSlug(p.name);
        
        // Find all images for this product
        const productImages = newImages?.filter(img => img.productId === p.id).map(img => img.url) || p.images || [];

        // Find the specific placeholder object for the primary image
        const mainImagePlaceholder = newImages?.find(img => img.productId === p.id);
        
        return {
          ...p,
          id: productId,
          slug: productSlug,
          // Use the placeholder's ID for the main image
          imageId: mainImagePlaceholder?.id || `img-${productSlug}`,
          // Assign all found image URLs
          images: productImages,
        };
      });

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
    <ProductsContext.Provider value={{ products, addProducts, deleteProducts, isLoaded, categories, allCategories }}>
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
