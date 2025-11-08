
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/lib/products-context';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AddToCartButton from './AddToCartButton';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // ✅ Fallback resolver: convert placeholder ID → valid URL
  const resolveImageUrl = useMemo(() => {
    return (idOrUrl?: string): string => {
      if (!idOrUrl) return '/fallback.png';
      if (idOrUrl.startsWith('http') || idOrUrl.startsWith('/')) return idOrUrl;
      const found = PlaceHolderImages.find((img) => img.id === idOrUrl);
      return found?.imageUrl || '/fallback.png';
    };
  }, []);

  const primaryImageSrc = resolveImageUrl(product.imageId);
  const allImageUrls = (product.images || []).map(resolveImageUrl);
  const secondaryImageSrc =
    allImageUrls.find((url) => url && url !== primaryImageSrc) || primaryImageSrc;

  const [currentImage, setCurrentImage] = useState(primaryImageSrc);

  useEffect(() => {
    setCurrentImage(primaryImageSrc);
  }, [primaryImageSrc]);

  const handleMouseEnter = () => {
    if (secondaryImageSrc) setCurrentImage(secondaryImageSrc);
  };

  const handleMouseLeave = () => {
    setCurrentImage(primaryImageSrc);
  };

  return (
    <Card
      className="flex flex-col overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/products/${product.slug}`} className="group">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full bg-white">
            {currentImage && currentImage.length > 0 && currentImage !== '/fallback.png' ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                onError={(e) => {
                  // ✅ ensure broken URLs fallback gracefully
                  const target = e.target as HTMLImageElement;
                  target.src = '/fallback.png';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <span className="text-sm text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-medium">{product.name}</CardTitle>
        </CardContent>
      </Link>
      <CardFooter className="mt-auto flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(product.price)}
        </p>
        <AddToCartButton product={product} />
      </CardFooter>
    </Card>
  );
}
