
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
import { formatCurrency } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  // Client-side state
  const [isClient, setIsClient] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    // This effect runs only on the client, after the component mounts
    setIsClient(true);
  }, []);

  const isFavorite = isClient && wishlist.includes(product.id);

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
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      removeFromWishlist(product.id);
      toast({
        title: 'Αφαιρέθηκε από τα Αγαπημένα',
        description: `${product.name} αφαιρέθηκε από τη λίστα επιθυμιών.`,
      });
    } else {
      addToWishlist(product.id);
      toast({
        title: 'Προστέθηκε στα Αγαπημένα!',
        description: `${product.name} προστέθηκε στη λίστα επιθυμιών.`,
      });
    }
  }

  const productCategory = product.category.split(' > ').pop();
  const pointsEarned = Math.floor(product.price * 5);
  const installmentAmount = (product.price / 3).toFixed(2);
  const showKlarna = product.price >= 11.5;

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
            {showKlarna && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <span>ή σε 3 άτοκες δόσεις των {formatCurrency(parseFloat(installmentAmount))} με</span>
                    <Image 
                        src="https://i.postimg.cc/xdpY00RT/Marketing-Badge-With-Clear-Space.png" 
                        alt="Klarna" 
                        width={40} 
                        height={20} 
                        className="object-contain"
                        unoptimized
                    />
                </div>
            )}
            <div className="mt-1 text-xs text-blue-600">
              {pointsEarned} πόντους ανταμοιβής
            </div>
            
            <div className="mt-auto flex items-end justify-between pt-4">
                <AddToCartButton product={product} />
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                            "h-9 w-9 shrink-0 rounded-full bg-gray-200 text-gray-800 shadow-md hover:bg-gray-300",
                            isFavorite && "bg-red-100 text-red-500 hover:bg-red-200"
                        )}
                        onClick={handleFavoriteClick}
                        aria-label="Add to favorites"
                    >
                        <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                    </Button>
                </div>
            </div>
        </div>
      </Link>
    </div>
  );
}
