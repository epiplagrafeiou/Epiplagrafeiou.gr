
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let storedProducts: Product[] = [];
    try {
      const storedData = localStorage.getItem('products');
      if (storedData) {
        storedProducts = JSON.parse(storedData);
      }
    } catch (e) {
      console.error("Failed to parse products from localStorage", e);
    }
    
    const productMap = new Map<string, Product>();
    initialProducts.forEach(p => productMap.set(p.id, p));
    storedProducts.forEach(p => productMap.set(p.id, p));

    setProducts(Array.from(productMap.values()));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Create a version of products for storage that omits the large `images` array.
      const productsForStorage = products.map(({ images, ...rest }) => rest);
      try {
        localStorage.setItem('products', JSON.stringify(productsForStorage));
      } catch (e) {
        console.error("Failed to save products to localStorage", e);
      }
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

        // Find placeholder for the main image, or create it if it doesn't exist.
        let mainImagePlaceholder = PlaceHolderImages.find(img => img.imageUrl === mainImageUrl);
        let imageId = mainImagePlaceholder?.id;

        if (!imageId && mainImageUrl) {
           imageId = `prod-img-${p.id}-main`;
           addDynamicPlaceholder({
               id: imageId,
               imageUrl: mainImageUrl,
               description: p.name,
               imageHint: p.name.substring(0, 20),
           });
        }
        
        // If still no imageId, try to find one from the rest of the images
        if (!imageId && allImageUrls.length > 0) {
            const firstImagePlaceholder = PlaceHolderImages.find(img => img.imageUrl === allImageUrls[0]);
            imageId = firstImagePlaceholder?.id;
        }

        // Fallback if no images are found at all
        if (!imageId) {
            imageId = `prod-fallback-${p.id}`;
        }

        return {
          ...p,
          id: productId,
          slug: productSlug,
          imageId: imageId,
          images: allImageUrls, // This will be stripped before saving to localStorage
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
    const idsToDeleteSet = new Set(productIds);

    setProducts(prev => {
        const productsToKeep = prev.filter(p => {
            if (idsToDeleteSet.has(p.id)) {
                // Collect all image IDs associated with this product for deletion
                const placeholdersForProduct = PlaceHolderImages.filter(img => (p.images || []).includes(img.imageUrl));
                imageIdsToDelete.push(...placeholdersForProduct.map(img => img.id));
                // Also add the main imageId if it exists
                if (p.imageId) {
                    imageIdsToDelete.push(p.imageId);
                }
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

  // At runtime, enrich products with the full image list from the placeholder system
  const runtimeProducts = useMemo(() => {
    if (!context.isLoaded) return [];
    return context.products.map(p => {
        const productImages = PlaceHolderImages.filter(img => img.id.startsWith(`prod-img-${p.id.replace('prod-','')}`));
        return {
            ...p,
            images: productImages.map(img => img.imageUrl)
        }
    });
  }, [context.products, context.isLoaded]);
  
  return { ...context, products: runtimeProducts };
};
