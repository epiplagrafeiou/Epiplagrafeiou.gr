
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { products as initialProducts, type Product } from './data';
import { addDynamicPlaceholder } from './placeholder-images';
import { createSlug } from './utils';

interface ProductsContextType {
  products: Product[];
  addProducts: (newProducts: Omit<Product, 'slug' | 'imageId'>[], newImages?: { id: string; url: string; hint: string, productId: string }[]) => void;
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

  const addProducts = (newProducts: Omit<Product, 'slug' | 'imageId' | 'images' | 'mainImage'>[], newImages?: { id: string; url: string; hint: string, productId: string }[]) => {

    if (newImages) {
        addDynamicPlaceholder(newImages.map(img => ({
            id: img.id,
            imageUrl: img.url,
            description: img.hint,
            imageHint: img.hint,
        })));
    }

    setProducts((prevProducts) => {
      const productsToAdd = (newProducts as any[]).map((p, index) => {
        const productId = p.id ? `prod-${p.id}` : `prod-${Date.now()}-${index}`;
        const productSlug = createSlug(p.name);
        
        // Use the mainImage from the parsed data as the primary source.
        const mainImageUrl = p.mainImage;
        const allImageUrls = p.images || [];

        // Create a unique placeholder ID for the main image.
        const mainImageId = `prod-img-${p.id}-main`;
        
        // Find the placeholder object that corresponds to the main image URL.
        const mainImagePlaceholder = newImages?.find(img => img.url === mainImageUrl);
        
        return {
          ...p,
          id: productId,
          slug: productSlug,
          // Use the specifically created ID for the main image, or a fallback.
          imageId: mainImagePlaceholder?.id || mainImageId,
          images: allImageUrls,
        };
      });

      const uniqueNewProducts = productsToAdd.filter(
        newProd => !prevProducts.some(existingProd => existingProd.id === newProd.id)
      );
      
      const updatedProducts = prevProducts.map(p => {
          const updated = uniqueNewProducts.find(up => up.id === p.id);
          return updated ? updated : p;
      });
      
      const newProductsToAdd = uniqueNewProducts.filter(
          up => !prevProducts.some(p => p.id === up.id)
      );

      return [...updatedProducts, ...newProductsToAdd];
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
