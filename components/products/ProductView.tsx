
'use client';
import Image from 'next/image';
import { formatCurrency, cn, createSlug } from 'lib/utils';
import AddToCartButton from './AddToCartButton';
import { Separator } from 'components/ui/separator';
import { Product } from 'lib/products-context';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "components/ui/carousel"
import { Card, CardContent } from "components/ui/card"
import { Truck, Award, Star, ShieldCheck } from 'lucide-react';
import { PaymentIcons } from 'components/icons/PaymentIcons';

interface ProductViewProps {
    product: Product;
    allProducts: Product[];
}

export function ProductView({ product, allProducts }: ProductViewProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
 
  const allImages = useMemo(() => {
    if (!product || !product.images) return [];
    return product.images;
  }, [product]);

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

  const categoryParts = product ? product.category.split(' > ') : [];
  let currentPath = '';
  const breadcrumbs = categoryParts.map((part, index) => {
    currentPath += `${currentPath ? '/' : ''}${createSlug(part)}`;
    return {
      name: part,
      href: `/category/${currentPath}`
    };
  });

  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageId,
    description: product.description,
    sku: product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Epipla Graphiou',
    },
    review: {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '4.9',
          bestRating: '5',
        },
        author: {
          '@type': 'Person',
          name: 'Andreas Giorgaras',
        },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '86',
    },
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? `${window.location.origin}/products/${product.slug}` : '',
      priceCurrency: 'EUR',
      price: product.price.toFixed(2),
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      itemCondition: 'https://schema.org/NewCondition',
      availability: (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
          '@type': 'Organization',
          name: 'Epipla Graphiou AI eShop',
      }
    },
  } : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: typeof window !== 'undefined' ? window.location.origin : '',
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: 'Products',
            item: typeof window !== 'undefined' ? `${window.location.origin}/products` : '',
        },
        ...breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 3,
            name: crumb.name,
            item: typeof window !== 'undefined' ? `${window.location.origin}${crumb.href}` : '',
        }))
    ],
  };

  const pointsEarned = Math.floor(product.price * 5);

  return (
    <div className="container mx-auto px-4 py-12">
      {productSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
                loop: allImages.length > 1,
            }}
          >
            <CarouselContent>
              {allImages.length > 0 ? allImages.map((imageUrl, index) => (
                <CarouselItem key={index}>
                  <Card>
                    <CardContent className="relative flex aspect-square items-center justify-center p-0">
                      <Image
                        src={imageUrl}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        className="rounded-lg object-contain"
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
              {allImages.map((imageUrl, index) => (
                 <button
                  key={index}
                  onClick={() => onThumbClick(index)}
                  className={cn(
                    "overflow-hidden rounded-md aspect-square bg-secondary flex items-center justify-center border-2",
                    current === index ? 'border-primary' : 'border-transparent'
                  )}
                 >
                  <Image
                    src={imageUrl}
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
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold">
              {formatCurrency(product.price)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
          </div>
          <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-1">
              <Award className="h-4 w-4" />
              Κερδίζεις {pointsEarned} πόντους με αυτή την αγορά!
          </div>
          <Separator className="my-6" />
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <div className="mt-8">
            <AddToCartButton product={product} size="lg" />
          </div>
          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 flex-shrink-0 text-primary" />
              <span>Δωρεάν μεταφορικά για παραγγελίες άνω των 150€</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 flex-shrink-0 text-primary" />
              <span>60 χρόνια εμπειρίας, η σφραγίδα της σιγουριάς μας</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 flex-shrink-0 text-primary" />
              <span>4.9/5 Αξιολόγηση από 86+ κριτικές</span>
            </div>
          </div>
           <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Ασφαλείς Πληρωμές SSL</span>
            </div>
            <div className="mt-4">
                <PaymentIcons />
            </div>
        </div>
      </div>
    </div>
  );
}
