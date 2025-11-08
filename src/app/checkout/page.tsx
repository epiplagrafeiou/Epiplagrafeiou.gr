
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const SHIPPING_COST = 10;
const FREE_SHIPPING_THRESHOLD = 150;

export default function CheckoutPage() {
  const { cartItems, totalAmount, clearCart } = useCart();
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'Greece',
    },
  });

  const totalSurcharge = cartItems.reduce((acc, item) => acc + (item.shippingSurcharge || 0) * item.quantity, 0);
  const baseShipping = totalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const totalShipping = baseShipping + totalSurcharge;
  const total = totalAmount + totalShipping;

  const onSubmit = (data: CheckoutFormValues) => {
    console.log(data);
    // Here you would process the payment
    alert('Payment successful! (mock)');
    clearCart();
    // Redirect to a confirmation page
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
        <div className="lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const image = item.imageId;
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        {image && (
                          <Image
                            src={image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        )}
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{item.name}</p>
                         {item.shippingSurcharge && item.shippingSurcharge > 0 && (
                            <p className="text-xs text-destructive">+ {formatCurrency(item.shippingSurcharge)} surcharge</p>
                         )}
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{totalShipping > 0 ? formatCurrency(totalShipping) : 'Free'}</span>
                </div>
                 {totalSurcharge > 0 && (
                    <div className="flex justify-between pl-4 text-xs text-muted-foreground">
                        <span>(Includes {formatCurrency(totalSurcharge)} in surcharges)</span>
                    </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:order-1">
          <h1 className="font-headline text-3xl font-bold">Checkout</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
              <Card>
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="firstName" render={({ field }) => (
                      <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="lastName" render={({ field }) => (
                      <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField name="city" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="postalCode" render={({ field }) => (
                      <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="country" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Select your payment method.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Button type="button" variant="outline" className="h-12">Apple Pay</Button>
                        <Button type="button" variant="outline" className="h-12">Google Pay</Button>
                    </div>
                    <Button type="button" variant="outline" className="h-12 w-full">Klarna</Button>
                    <Separator />
                    <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Pay {formatCurrency(total)}
                    </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
