
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { products as initialProductsData, type Product } from './data';
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
    
    const initialProductMap = new Map<string, Product>(initialProductsData.map(p => [p.id, p]));
    const productMap = new Map<string, Product>();

    initialProductsData.forEach(p => productMap.set(p.id, p));

    storedProducts.forEach(p_stored => {
        const initial = initialProductMap.get(p_stored.id);
        const combined = { ...initial, ...p_stored };
        productMap.set(p_stored.id, combined);
    });

    setProducts(Array.from(productMap.values()));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Exclude the 'images' array before saving to localStorage to save space
      const productsForStorage = products.map(({ images, ...rest }) => ({
        ...rest,
        stock: rest.stock ?? 0 // Ensure stock is always a number
      }));
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
        
        let imageId: string | undefined;
        // First, check if a main image placeholder was already created in this batch
        const mainImageInfo = newImagesData?.find(img => img.productId === p.id && img.url === p.mainImage);

        if (mainImageInfo) {
            imageId = mainImageInfo.id;
        } else if (p.images && p.images.length > 0) {
            // Fallback: try to find any image placeholder for this product
            const anyImageInfo = newImagesData?.find(img => img.productId === p.id);
            imageId = anyImageInfo?.id;
        } else {
            // Final fallback
            imageId = `prod-fallback-${p.id}`;
        }
        
        return {
          ...p,
          id: productId,
          slug: productSlug,
          imageId: imageId,
          price: p.price,
          category: p.category,
          description: p.description,
          stock: p.stock ?? 0,
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
                // Find all image placeholders associated with this product's original ID
                const productNumId = p.id.replace('prod-', '');
                const placeholdersForProduct = PlaceHolderImages.filter(img => img.id && img.id.startsWith(`prod-img-${productNumId}-`));
                imageIdsToDelete.push(...placeholdersForProduct.map(img => img.id));
                // Also add the primary imageId if it's not already in the list
                if (p.imageId && !imageIdsToDelete.includes(p.imageId)) {
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


  const enrichedProducts = useMemo(() => {
    if (!isLoaded) return [];
    return products.map(p => {
        const productNumId = p.id.replace('prod-', '');
        // Precise filtering: find images whose ID starts with the unique product identifier prefix
        const imagePlaceholders = PlaceHolderImages.filter(img => img.id && img.id.startsWith(`prod-img-${productNumId}-`));

        let allImageUrls = imagePlaceholders.map(img => img.imageUrl);
        
        const mainImage = PlaceHolderImages.find(img => img.id === p.imageId);
        if (mainImage) {
           allImageUrls = [mainImage.imageUrl, ...allImageUrls.filter(url => url !== mainImage.imageUrl)];
        }

        return {
            ...p,
            stock: p.stock ?? 0, // Ensure stock is always a number
            images: Array.from(new Set(allImageUrls))
        }
    });
  }, [products, isLoaded]);

  return (
    <ProductsContext.Provider value={{ products: enrichedProducts, addProducts, deleteProducts, isLoaded, categories, allCategories }}>
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
