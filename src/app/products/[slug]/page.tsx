
'use client';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency, cn, createSlug } from '@/lib/utils';
import AddToCartButton from '@/components/products/AddToCartButton';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/data';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { products, isLoaded } = useProducts();
  const params = useParams();
  const { slug } = params;

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && products.length > 0 && slug) {
      const foundProduct = products.find((p) => p.slug === slug);
      setProduct(foundProduct);
    }
  }, [isLoaded, products, slug]);
  
  const allImages = product?.images?.map(imageUrl => {
    const placeholder = PlaceHolderImages.find(p => p.imageUrl === imageUrl);
    return {
      url: imageUrl,
      hint: placeholder?.imageHint || product.name.substring(0,20)
    }
  }) || [];

  useEffect(() => {
    if (product) {
      const firstImage = allImages.find(img => img.url === product.imageId);
      if (firstImage) {
        setActiveImage(firstImage.url);
      } else if (allImages.length > 0) {
        setActiveImage(allImages[0].url);
      }
    }
  }, [product, allImages]);


  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!product) {
    if (isLoaded) {
      notFound();
    }
    return <div>Loading...</div>;
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const categoryParts = product.category.split(' > ');
  let currentPath = '';
  const breadcrumbs = categoryParts.map((part, index) => {
    currentPath += `${currentPath ? '/' : ''}${createSlug(part)}`;
    return {
      name: part,
      href: `/category/${currentPath}`
    };
  });

  return (
    <div className="container mx-auto px-4 py-12">
       <div className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center space-x-2">
            <span>/</span>
            <Link href={crumb.href} className="hover:text-foreground">{crumb.name}</Link>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
        <div>
          <div className="relative aspect-square rounded-lg bg-secondary flex items-center justify-center">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                width={600}
                height={600}
                className="h-full w-full rounded-lg object-contain"
                data-ai-hint={allImages?.find(i => i.url === activeImage)?.hint}
              />
            ): (
              <div className="flex h-full w-full items-center justify-center bg-secondary aspect-square">
                  <span className="text-sm text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
          {allImages && allImages.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              {allImages.map((image, index) => (
                 <button
                  key={index}
                  onClick={() => setActiveImage(image.url)}
                  className={cn(
                    "rounded-md aspect-square bg-secondary flex items-center justify-center overflow-hidden border-2",
                    activeImage === image.url ? 'border-primary' : 'border-transparent'
                  )}
                 >
                  <Image
                    src={image.url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    width={100}
                    height={100}
                    className="h-full w-full object-contain"
                  />
                 </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-headline text-3xl font-bold lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-bold">
            {formatCurrency(product.price)}
          </p>
          <Separator className="my-6" />
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <div className="mt-8">
            <AddToCartButton product={product} size="lg" />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 font-headline text-2xl font-bold">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
