'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart, CartItem } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Trash2, ShoppingBag, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const SHIPPING_COST = 10;
const FREE_SHIPPING_THRESHOLD = 150;

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCart();
  const image = item.imageId;

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
        {image && (
          <Image
            src={image}
            alt={item.name}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-grow">
        <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
          {item.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(item.price)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
            className="h-9 w-20"
            aria-label={`Quantity for ${item.name}`}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeFromCart(item.id)}
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
    </div>
  );
}

export default function CartPage() {
  const { cartItems, totalAmount } = useCart();

  const totalShipping = totalAmount >= FREE_SHIPPING_THRESHOLD || totalAmount === 0 ? 0 : SHIPPING_COST;
  const total = totalAmount + totalShipping;
  const pointsEarned = Math.floor(totalAmount * 5);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-headline text-3xl font-bold">Your Cart</h1>
      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="divide-y lg:col-span-2">
          {cartItems.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{totalShipping > 0 ? formatCurrency(totalShipping) : 'Free'}</span>
              </div>
               <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" /> Points Earned
                </span>
                <span className="font-medium">{pointsEarned}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
