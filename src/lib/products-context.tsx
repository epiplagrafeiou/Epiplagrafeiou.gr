
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // We are no longer loading from localStorage, just set loaded to true.
    // The initial state is set from the static data file.
    setIsLoaded(true);
  }, []);

  const categories = useMemo(() => {
    if (!isLoaded) return [];
    return Array.from(new Set(products.map(p => p.category.split(' > ').pop()!).filter(Boolean))).sort();
  }, [products, isLoaded]);
  
  const allCategories = useMemo(() => {
    if (!isLoaded) return [];
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
  }, [products, isLoaded]);

  const addProducts = (newProducts: Omit<Product, 'slug' | 'imageId'>[], newImagesData?: { id: string; url: string; hint: string, productId: string }[]) => {
    
    // Process all images provided and add them to the dynamic placeholder system.
    if (newImagesData) {
        const allPlaceholdersToAdd = newImagesData.map(img => ({
            id: img.id,
            imageUrl: img.url,
            description: img.hint,
            imageHint: img.hint,
        }));
        addDynamicPlaceholder(allPlaceholdersToAdd);
    }

    setProducts((prevProducts) => {
      // Map over the new products from the XML to create the final Product objects for the store
      const productsToAdd = (newProducts as any[]).map((p) => {
        const productId = `prod-${p.id}`;
        const productSlug = createSlug(p.name);
        
        const mainImageUrl = p.mainImage;
        const allImageUrls = p.images || [];

        // Find the full placeholder object for the main image using its URL.
        const mainImagePlaceholder = newImagesData?.find(img => img.url === mainImageUrl && img.productId === p.id);

        return {
          ...p,
          id: productId,
          slug: productSlug,
          // Assign the ID from the found placeholder. Fallback if not found.
          imageId: mainImagePlaceholder?.id || `prod-img-${p.id}-main`,
          images: allImageUrls,
          price: p.price,
          category: p.category,
          description: p.description
        };
      });
      
      const productMap = new Map(prevProducts.map(p => [p.id, p]));
      productsToAdd.forEach(p => productMap.set(p.id, p));

      return Array.from(productMap.values());
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
