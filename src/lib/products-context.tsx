
'use client';

import { createContext, useContext, useMemo, useEffect } from 'react';
import { createSlug } from './utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, writeBatch, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { PlaceHolderImages } from './placeholder-images';


export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageId: string; // This is now the URL of the main image
  category: string;
  images?: string[];
  stock?: number;
  supplierId: string;
}

const manualProducts: Product[] = [
    {
      id: "manual-001",
      name: "Σετ 5τμχ Ρόδες Για Καρέκλα Γραφείου",
      slug: "set-5tmch-rodes-gia-karekla-grafeiou",
      price: 12.99,
      originalPrice: 13.99,
      description: "Ρόδες σετ 5 τεμαχίων για καρέκλες γραφείου.",
      imageId: "https://www.zougris.gr/content/images/thumbs/0008329.jpeg",
      category: "Ανταλλακτικά Για Καρέκλες Γραφείου",
      images: ["https://www.zougris.gr/content/images/thumbs/0008329.jpeg"],
      stock: 177,
      supplierId: "manual"
    },
    {
      id: "11.2213",
      name: "ΑΜΟΡΤΙΣΕΡ ΜΑΥΡΟ ΚΑΡ.ΓΡΑΦΕΙΟΥ 26/35εκ.",
      slug: "amortiser-mayro-kargrafeiou-2635ek",
      price: 18.99,
      description: "Αμορτισέρ μαύρο για καρέκλες γραφείου 26/35εκ.",
      imageId: "https://www.zougris.gr/content/images/thumbs/0004662.jpeg",
      category: "Ανταλλακτικά Για Καρέκλες Γραφείου",
      images: ["https://www.zougris.gr/content/images/thumbs/0004662.jpeg"],
      stock: 350,
      supplierId: "manual"
    },
    {
      id: "01.0942",
      name: "ΠΟΔΙ Φ62εκ. ΧΡΩΜΙΟΥ ΓΙΑ ΚΑΡΕΚΛΑ ΓΡΑΦΕΙΟΥ",
      slug: "podi-f62ek-chromiou-gia-karekla-grafeiou",
      price: 28.99,
      description: "Πόδι χρωμίου Φ62εκ. για απόλυτη ανθεκτικότητα στο βάρος.",
      imageId: "https://www.zougris.gr/content/images/thumbs/0010615.jpeg",
      category: "Ανταλλακτικά Για Καρέκλες Γραφείου",
      images: ["https://www.zougris.gr/content/images/thumbs/0010615.jpeg", "https://www.zougris.gr/content/images/thumbs/0010616.jpeg"],
      stock: 98,
      supplierId: "manual"
    },
    {
      id: "manual-pelmata",
      name: "Σέτ 5τμχ Πέλματα Για Καρέκλα Γραφείου",
      slug: "set-5tmch-pelmata-gia-karekla-grafeiou",
      price: 12.99,
      description: "Πέλματα, κάντε τις καρέκλες σας σταθερές αντικαθιστώντας εύκολα τις ρόδες με τα πέλματα.",
      imageId: "https://www.zougris.gr/content/images/thumbs/0008499.jpeg",
      category: "Ανταλλακτικά Για Καρέκλες Γραφείου",
      images: ["https://www.zougris.gr/content/images/thumbs/0008499.jpeg"],
      stock: 61,
      supplierId: "manual"
    },
    {
      id: "manual-pro-wheels",
      name: "Σετ 5τμχ Ρόδες Pro 63χιλ. Ελαστικής Πολυουρεθάνης Για Καρέκλα Γραφείου",
      slug: "set-5tmch-rodes-pro-63chil-elastikis-polyourethanis-gia-karekla-grafeiou",
      price: 28.99,
      description: "Ρόδες Pro σετ 5 τεμαχίων για καρέκλες γραφείου.Από ελαστική πολυουρεθάνη για ομαλότερη κύλιση χωρίς να αφήνει σημάδια στο δάπεδο.Κατάλληλες για καρέκλες με πείρο 11 χιλιοστών.",
      imageId: "https://www.zougris.gr/content/images/thumbs/0010300.jpeg",
      category: "Ανταλλακτικά Για Καρέκλες Γραφείου",
      images: ["https://www.zougris.gr/content/images/thumbs/0010300.jpeg"],
      stock: 214,
      supplierId: "manual"
    }
];


interface ProductsContextType {
  products: Product[];
  adminProducts: Product[];
  addProducts: (
    newProducts: (Partial<Omit<Product, 'slug' | 'imageId'>> & { id: string; supplierId: string; images: string[]; mainImage?: string | null; name: string; price: number; category: string; description: string; stock: number })[]
  ) => void;
  updateProduct: (product: Product) => void;
  deleteProducts: (productIds: string[]) => void;
  isLoaded: boolean;
  categories: string[];
  allCategories: string[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  // Seed initial manual products into Firestore if the collection is empty.
  useEffect(() => {
    const seedProducts = async () => {
      if (firestore) {
        const productsCollection = collection(firestore, 'products');
        const snapshot = await getDocs(productsCollection);
        if (snapshot.empty) {
          console.log('Products collection is empty, seeding manual products...');
          const batch = writeBatch(firestore);
          manualProducts.forEach((product) => {
            const docRef = doc(firestore, 'products', product.id);
            batch.set(docRef, product);
          });
          await batch.commit();
          console.log('Seeding complete.');
        }
      }
    };
    seedProducts();
  }, [firestore]);
  

  const { data: fetchedProducts, isLoading } = useCollection<Product>(productsQuery);
  
  const products = useMemo(() => {
    return fetchedProducts || [];
  }, [fetchedProducts]);
  
  const resolveImageUrl = (idOrUrl: string | undefined): string => {
    if (!idOrUrl) return '';
    if (idOrUrl.startsWith('http') || idOrUrl.startsWith('/')) return idOrUrl;
    const found = PlaceHolderImages.find((img) => img.id === idOrUrl);
    return found?.imageUrl || '';
  };

  const addProducts = async (
    newProducts: (Omit<Product, 'slug' | 'imageId'> & { mainImage?: string | null, images: string[] })[],
  ) => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const productBatchData: { path: string; data: any }[] = [];

    newProducts.forEach((p) => {
        const productId = p.id;
        const productRef = doc(firestore, 'products', productId);
        const productSlug = createSlug(p.name);
        
        const sortedImages = [...(p.images || [])];
        if (p.mainImage) {
            const mainImageIndex = sortedImages.indexOf(p.mainImage);
            if (mainImageIndex > 0) {
                [sortedImages[0], sortedImages[mainImageIndex]] = [sortedImages[mainImageIndex], sortedImages[0]];
            } else if (mainImageIndex === -1) {
                sortedImages.unshift(p.mainImage);
            }
        }
        
        const imageId = sortedImages[0] || '';
        
        const productData = {
          ...p,
          id: productId,
          slug: productSlug,
          imageId: imageId, // Save the URL
          images: sortedImages,
          price: p.price,
          category: p.category,
          description: p.description,
          stock: Number(p.stock) || 0,
        };
        
        delete (productData as any).mainImage;

        productBatchData.push({ path: productRef.path, data: productData });
        batch.set(productRef, productData, { merge: true });
    });

    batch.commit().catch(error => {
       productBatchData.forEach(item => {
         const permissionError = new FirestorePermissionError({
           path: item.path,
           operation: 'create', // This will cover create/update due to merge:true
           requestResourceData: item.data,
         });
         errorEmitter.emit('permission-error', permissionError);
       });
    });
  };
  
  const updateProduct = async (product: Product) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'products', product.id);
    const { id, ...productData } = product;

    updateDoc(productRef, productData).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: productRef.path,
            operation: 'update',
            requestResourceData: productData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteProducts = async (productIds: string[]) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    productIds.forEach(productId => {
      const productRef = doc(firestore, 'products', productId);
      batch.delete(productRef);
    });

    batch.commit().catch(error => {
        productIds.forEach(productId => {
            const permissionError = new FirestorePermissionError({
                path: `products/${productId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    });
  };

  const allProducts = useMemo(() => {
    return products.map((p) => {
        const mainImageUrl = resolveImageUrl(p.imageId);
        const allImageUrls = (p.images || []).map(resolveImageUrl);

        return {
            ...p,
            imageId: mainImageUrl,
            images: Array.from(new Set([mainImageUrl, ...allImageUrls])).filter(Boolean)
        };
    });
  }, [products]);

  const categories = useMemo(() => {
    const publicFacingProducts = allProducts.filter((p) => (p.stock ?? 0) > 0);
    return Array.from(
      new Set(
        publicFacingProducts
          .map((p) => p.category.split(' > ').pop()!)
          .filter(Boolean)
      )
    ).sort();
  }, [allProducts]);
  
  const allCategories = useMemo(() => {
    const publicFacingProducts = allProducts.filter((p) => (p.stock ?? 0) > 0);
    return Array.from(
      new Set(publicFacingProducts.map((p) => p.category).filter(Boolean))
    ).sort();
  }, [allProducts]);

  return (
    <ProductsContext.Provider
      value={{
        products: allProducts.filter(p => (p.stock ?? 0) > 0),
        adminProducts: allProducts,
        addProducts,
        updateProduct,
        deleteProducts,
        isLoaded: !isLoading,
        categories: categories,
        allCategories: allCategories,
      }}
    >
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
