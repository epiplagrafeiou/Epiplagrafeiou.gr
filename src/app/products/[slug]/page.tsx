
'use client';

import { notFound, useParams } from 'next/navigation';
import { useProducts } from '@/lib/products-context';
import { createSlug, findCategoryPath } from '@/lib/utils';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductView } from '@/components/products/ProductView';
import { useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { StoreCategory } from '@/components/admin/CategoryManager';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, isLoaded } = useProducts();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: storeCategories } = useCollection<StoreCategory>(categoriesQuery);

  const product = isLoaded ? products.find((p) => createSlug(p.name) === slug) : undefined;
  
  const categoryPath = useMemo(() => {
    if (!product || !storeCategories) return [];
    return findCategoryPath(product.categoryId, storeCategories);
  }, [product, storeCategories]);


  useEffect(() => {
    if (isLoaded && !product) {
      notFound();
    }
  }, [isLoaded, product]);
  
  const variants = useMemo(() => {
    if (!product || !product.variantGroupKey) return [];
    return products.filter(p => p.variantGroupKey === product.variantGroupKey);
  }, [product, products]);

  if (!isLoaded || !product) {
    return <div>Loading...</div>;
  }

  // Determine related products, excluding other variants of the same product
  const relatedProducts = products.filter(p => {
    // Exclude self and other variants
    if (product.variantGroupKey && p.variantGroupKey === product.variantGroupKey) {
      return false;
    }
    // Simple relation: same final category, but not the same product
    return p.categoryId === product.categoryId && p.id !== product.id;
  }).slice(0, 4);
  

  return (
    <>
       <Head>
        <title>{`${product.name} - Epipla Graphiou AI eShop`}</title>
        <meta name="description" content={product.description} />
        <link rel="canonical" href={`/products/${slug}`} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.imageId} />
        <meta property="og:type" content="product" />
      </Head>
      
      <ProductView product={product} variants={variants} allProducts={products} categoryPath={categoryPath} />

      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 mt-4">
          <h2 className="mb-8 font-headline text-2xl font-bold">
            Μπορεί επίσης να σας αρέσουν
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
