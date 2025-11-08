
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { addDynamicPlaceholder, removeDynamicPlaceholders, PlaceHolderImages } from './placeholder-images';
import { createSlug } from './utils';

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
}


interface ProductsContextType {
  products: Product[]; // For public-facing store (in-stock only)
  adminProducts: Product[]; // For admin panel (all products)
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
    
    setProducts(storedProducts);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Ensure stock is always a number when saving
      const productsForStorage = products.map(({ images, ...rest }) => ({
        ...rest,
        stock: rest.stock ?? 0
      }));
      try {
        localStorage.setItem('products', JSON.stringify(productsForStorage));
      } catch (e) {
        console.error("Failed to save products to localStorage", e);
      }
    }
  }, [products, isLoaded]);
  
  const enrichedProducts = useMemo(() => {
    if (!isLoaded) return [];
    // This is the source of truth for ALL products
    return products.map(p => {
        const productNumId = p.id.replace('prod-', '');
        const imagePlaceholders = PlaceHolderImages.filter(img => img.id && img.id.startsWith(`prod-img-${productNumId}-`));

        let allImageUrls = imagePlaceholders.map(img => img.imageUrl);
        
        const mainImage = PlaceHolderImages.find(img => img.id === p.imageId);
        if (mainImage) {
           allImageUrls = [mainImage.imageUrl, ...allImageUrls.filter(url => url !== mainImage.imageUrl)];
        }

        // Correctly merge existing product data (including stock) with new image array
        return {
            ...p,
            stock: p.stock ?? 0,
            images: Array.from(new Set(allImageUrls))
        };
    });
  }, [products, isLoaded, PlaceHolderImages]);

  const inStockProducts = useMemo(() => {
    // Filter for public-facing store
    return enrichedProducts.filter(p => (p.stock ?? 0) > 0);
  }, [enrichedProducts]);
  
  const categories = useMemo(() => {
    if (!isLoaded) return [];
    // Categories should only be generated from products that are visible in the store
    return Array.from(new Set(inStockProducts.map(p => p.category.split(' > ').pop()!).filter(Boolean))).sort();
  }, [inStockProducts, isLoaded]);
  
  const allCategories = useMemo(() => {
    if (!isLoaded) return [];
    // All categories should also only be from in-stock products
    return Array.from(new Set(inStockProducts.map(p => p.category).filter(Boolean))).sort();
  }, [inStockProducts, isLoaded]);

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
        const mainImageInfo = newImagesData?.find(img => img.productId === p.id && img.url === p.mainImage);

        if (mainImageInfo) {
            imageId = mainImageInfo.id;
        } else if (p.images && p.images.length > 0) {
            const anyImageInfo = newImagesData?.find(img => img.productId === p.id);
            imageId = anyImageInfo?.id;
        } else {
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
                const productNumId = p.id.replace('prod-', '');
                const placeholdersForProduct = PlaceHolderImages.filter(img => img.id && img.id.startsWith(`prod-img-${productNumId}-`));
                imageIdsToDelete.push(...placeholdersForProduct.map(img => img.id));
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

  return (
    <ProductsContext.Provider value={{ 
        products: inStockProducts, // Public list
        adminProducts: enrichedProducts, // Admin list
        addProducts, 
        deleteProducts, 
        isLoaded, 
        categories, 
        allCategories 
    }}>
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
