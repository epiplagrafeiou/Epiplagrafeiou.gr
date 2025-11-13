
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Product } from '@/lib/products-context';
import { Button } from '@/components/ui/button';
import { Heart, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PriceDisplay } from './PriceDisplay';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const primaryImageSrc =
    product.imageId && product.imageId.length > 0
      ? product.imageId
      : product.images?.[0];

  const allImageUrls = product.images || [];
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
  
  const handleActionClick = (e: React.MouseEvent, action: 'favorite') => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: 'Added to Favorites!',
      description: `${product.name} has been added to your favorites.`,
    });
  }

  const productCategory = product.category.split(' > ').pop();
  const pointsEarned = Math.floor(product.price * 5);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/products/${product.slug}`} className="group flex h-full flex-col">
        <div className="relative h-64 w-full bg-white">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-contain transition-opacity duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <span className="text-sm text-muted-foreground">No Image</span>
              </div>
            )}
        </div>

        <div className="flex flex-1 flex-col p-4">
            <p className="text-sm font-semibold uppercase">{product.name}</p>
            <p className="text-sm text-muted-foreground">{productCategory}</p>

            <div className="mt-2 flex items-center justify-between">
                <PriceDisplay price={product.price} />
            </div>
            <div className="mt-1 text-xs font-medium text-green-600 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Κερδίζεις {pointsEarned} πόντους
            </div>
            
            <div className="mt-auto flex items-end justify-between pt-4">
                <AddToCartButton product={product} />
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full bg-gray-200 text-gray-800 shadow-md hover:bg-gray-300"
                        onClick={(e) => handleActionClick(e, 'favorite')}
                        aria-label="Add to favorites"
                    >
                        <Heart className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
      </Link>
    </div>
  );
}
