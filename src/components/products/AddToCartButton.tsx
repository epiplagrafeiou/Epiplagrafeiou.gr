
'use client';

import { useCart } from '@/lib/cart-context';
import type { Product } from '@/lib/products-context';
import { Button, type ButtonProps } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddToCartButtonProps extends ButtonProps {
  product: Product;
  quantity?: number;
}

export default function AddToCartButton({ product, quantity = 1, ...props }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isInStock = (product.stock ?? 0) > 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: 'Προστέθηκε στο καλάθι!',
      description: `Το προϊόν '${product.name}' προστέθηκε στο καλάθι σας.`,
    });
  };

  if (!isInStock) {
    return (
      <Button disabled {...props} size="icon" className="sm:hidden">
        <ShoppingCart className="h-4 w-4" />
        <span className="sr-only">Εξαντλημένο</span>
      </Button>
    )
  }

  return (
    <>
        <Button onClick={handleAddToCart} {...props} className="hidden bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Προσθήκη στο καλάθι
        </Button>
        <Button onClick={handleAddToCart} size="icon" {...props} className="inline-flex bg-accent text-accent-foreground hover:bg-accent/90 sm:hidden">
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Προσθήκη στο καλάθι</span>
        </Button>
    </>
  );
}
