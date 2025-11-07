
'use client';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency, cn, createSlug } from '@/lib/utils';
import AddToCartButton from '@/components/products/AddToCartButton';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"


export default function ProductDetailPage() {
  const { products, isLoaded } = useProducts();
  const params = useParams();
  const { slug } = params;

  const product = products.find((p) => createSlug(p.name) === slug);
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
 
  const allImages = product?.images?.map(imageUrl => {
    const placeholder = PlaceHolderImages.find(p => p.imageUrl === imageUrl);
    return {
      url: imageUrl,
      hint: placeholder?.imageHint || product.name.substring(0,20)
    }
  }) || [];

  const mainImageIndex = allImages.findIndex(img => img.url === product?.imageId);

  useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrent(api.selectedScrollSnap())
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const onThumbClick = useCallback((index: number) => {
    api?.scrollTo(index)
  }, [api])

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
            <div>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="mt-4 grid grid-cols-5 gap-4">
                    <Skeleton className="aspect-square w-full rounded-md" />
                    <Skeleton className="aspect-square w-full rounded-md" />
                    <Skeleton className="aspect-square w-full rounded-md" />
                    <Skeleton className="aspect-square w-full rounded-md" />
                    <Skeleton className="aspect-square w-full rounded-md" />
                </div>
            </div>
            <div className="flex flex-col justify-center">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="mt-4 h-8 w-1/4" />
                <Separator className="my-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
                <div className="mt-8">
                    <Skeleton className="h-12 w-40" />
                </div>
            </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    notFound();
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
          <Carousel 
            setApi={setApi} 
            className="w-full"
            opts={{
              startIndex: mainImageIndex > 0 ? mainImageIndex : 0,
            }}
          >
            <CarouselContent>
              {allImages.length > 0 ? allImages.map((image, index) => (
                <CarouselItem key={index}>
                  <Card>
                    <CardContent className="relative flex aspect-square items-center justify-center p-0">
                      <Image
                        src={image.url}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        className="rounded-lg object-contain"
                        data-ai-hint={image.hint}
                      />
                    </CardContent>
                  </Card>
                </CarouselItem>
              )) : (
                <CarouselItem>
                   <Card>
                    <CardContent className="relative flex aspect-square items-center justify-center p-6 bg-secondary">
                        <span className="text-sm text-muted-foreground">No Image</span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              )}
            </CarouselContent>
            {allImages.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
          
          {allImages.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              {allImages.map((image, index) => (
                 <button
                  key={index}
                  onClick={() => onThumbClick(index)}
                  className={cn(
                    "overflow-hidden rounded-md aspect-square bg-secondary flex items-center justify-center border-2",
                    current === index ? 'border-primary' : 'border-transparent'
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

    