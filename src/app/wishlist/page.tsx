
'use client';

import { useWishlist } from '@/lib/wishlist-context';
import { useProducts } from '@/lib/products-context';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { products, isLoaded } = useProducts();

  const favoriteProducts = products.filter(product => wishlist.includes(product.id));

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-headline text-3xl font-bold">Η Λίστα Επιθυμιών μου</h1>
      
      {isLoaded && favoriteProducts.length === 0 ? (
         <div className="mt-12 flex flex-col items-center justify-center text-center">
            <Heart className="h-24 w-24 text-muted-foreground/50" />
            <h2 className="mt-6 text-2xl font-semibold">Η λίστα επιθυμιών σας είναι άδεια</h2>
            <p className="mt-2 text-muted-foreground">Προσθέστε προϊόντα που σας αρέσουν για να τα βλέπετε εδώ.</p>
            <Button asChild className="mt-6">
                <Link href="/products">Δείτε τα προϊόντα</Link>
            </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </div>
  );
}
