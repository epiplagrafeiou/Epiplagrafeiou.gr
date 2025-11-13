
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Product } from '@/lib/products-context';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
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
  
  const handleActionClick = (e: React.MouseEvent, action: 'cart' | 'favorite') => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'cart') {
      // This is now handled by AddToCartButton
    } else {
       toast({
        title: 'Added to Favorites!',
        description: `${product.name} has been added to your favorites.`,
    });
    }
  }

  const productCategory = product.category.split(' > ').pop();

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

            {product.images && product.images.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.images.slice(0, 5).map((img, index) => (
                   <div key={index} className="relative h-8 w-8 rounded-full border">
                     <Image
                       src={img}
                       alt={`${product.name} variant ${index + 1}`}
                       fill
                       className="rounded-full object-cover"
                       onMouseOver={() => setCurrentImage(img)}
                     />
                   </div>
                ))}
              </div>
            )}
            
            <div className="mt-auto flex items-end justify-between pt-4">
                <div />
                <div className="flex items-center gap-2">
                    <AddToCartButton product={product} />
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
