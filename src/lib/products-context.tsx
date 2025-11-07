
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { products as initialProducts, type Product } from './data';
import { addDynamicPlaceholder, removeDynamicPlaceholders, PlaceHolderImages } from './placeholder-images';
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
    // We no longer load products from local storage to avoid quota errors.
    // The component will initialize with the static product data.
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
      const productsToAdd = (newProducts as any[]).map((p) => {
        const productId = `prod-${p.id}`;
        const productSlug = createSlug(p.name);
        
        const mainImageUrl = p.mainImage;
        const allImageUrls = p.images || [];

        const mainImagePlaceholder = PlaceHolderImages.find(img => img.imageUrl === mainImageUrl);
        let imageId = mainImagePlaceholder?.id;

        // If no placeholder exists for the main image, create one.
        if (!imageId && mainImageUrl) {
           imageId = `prod-img-${p.id}-main`;
           addDynamicPlaceholder({
               id: imageId,
               imageUrl: mainImageUrl,
               description: p.name,
               imageHint: p.name.substring(0, 20),
           });
        }
        // Fallback imageId if no main image is provided
        if (!imageId) {
          const firstImagePlaceholder = PlaceHolderImages.find(img => img.imageUrl === allImageUrls[0]);
          imageId = firstImagePlaceholder?.id || `prod-${p.id}-fallback`;
        }

        return {
          ...p,
          id: productId,
          slug: productSlug,
          imageId: imageId,
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
    let imageIdsToDelete: string[] = [];

    setProducts(prev => {
        const productsToKeep = prev.filter(p => {
            if (productIds.includes(p.id)) {
                // Find all placeholder images associated with this product's image URLs
                 const productImages = new Set(p.images || []);
                 if (p.imageId) {
                    const mainPlaceholder = PlaceHolderImages.find(img => img.id === p.imageId);
                    if (mainPlaceholder) {
                        productImages.add(mainPlaceholder.imageUrl);
                    }
                 }
                
                 const placeholdersForProduct = PlaceHolderImages.filter(img => productImages.has(img.imageUrl));
                 imageIdsToDelete.push(...placeholdersForProduct.map(img => img.id));

                return false;
            }
            return true;
        });
        return productsToKeep;
    });

    if (imageIdsToDelete.length > 0) {
      const uniqueImageIds = Array.from(new Set(imageIdsToDelete));
      removeDynamicPlaceholders(uniqueImageIds);
    }
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
