'use client';

import { notFound, useParams } from 'next/navigation';
import { useProducts } from '@/lib/products-context';
import { createSlug } from '@/lib/utils';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductView } from '@/components/products/ProductView';
import { useEffect } from 'react';
import Head from 'next/head';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, isLoaded } = useProducts();

  const product = isLoaded ? products.find((p) => createSlug(p.name) === slug) : undefined;

  useEffect(() => {
    if (isLoaded && !product) {
      notFound();
    }
  }, [isLoaded, product]);
  
  if (!isLoaded || !product) {
    // You can return a loading skeleton here
    return <div>Loading...</div>;
  }

  const getBaseProductName = (name: string) => {
    const words = name.split(' ');
    if (words.length > 3) {
      return words.slice(0, words.length - 2).join(' ');
    }
    return words.slice(0, words.length - 1).join(' ');
  };

  const baseName = getBaseProductName(product.name);

  let relatedProducts = products.filter(
    (p) =>
      p.id !== product.id &&
      p.name.includes(baseName) &&
      baseName.length > 5
  );

  if (relatedProducts.length < 4) {
    const productSubCategory = product.category.split(' > ').pop();
    const sameCategoryProducts = products.filter(
      (p) =>
        p.id !== product.id &&
        !relatedProducts.some((c) => c.id === p.id) &&
        p.category.split(' > ').pop() === productSubCategory
    );
    relatedProducts.push(...sameCategoryProducts);
  }

  const finalRelatedProducts = Array.from(
    new Set(relatedProducts.map((p) => p.id))
  )
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

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
      
      <ProductView product={product} allProducts={products} />

      {finalRelatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 mt-4">
          <h2 className="mb-8 font-headline text-2xl font-bold">
            Μπορεί επίσης να σας αρέσουν
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {finalRelatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
