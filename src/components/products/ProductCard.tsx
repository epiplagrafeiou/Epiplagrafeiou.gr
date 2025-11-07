
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [primaryImage, ...secondaryImages] = product.images || [];
  const secondaryImage = secondaryImages[0];

  const [currentImage, setCurrentImage] = useState(primaryImage);

  const handleMouseEnter = () => {
    if (secondaryImage) {
      setCurrentImage(secondaryImage);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImage(primaryImage);
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
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
