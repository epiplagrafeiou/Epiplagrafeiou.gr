
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { CreditCard } from 'lucide-react';

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  paymentMethod: z.enum(['card', 'applepay', 'googlepay', 'klarna', 'iris']).default('card'),
  cardName: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCVC: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'card') {
        return !!data.cardName && !!data.cardNumber && !!data.cardExpiry && !!data.cardCVC;
    }
    return true;
}, {
    message: "Card details are required when paying by card",
    path: ["cardName"], // you can pick any of the card fields for the error to attach to
});


type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const SHIPPING_COST = 10;
const FREE_SHIPPING_THRESHOLD = 150;

export default function CheckoutPage() {
  const { cartItems, totalAmount, clearCart } = useCart();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'Greece',
      paymentMethod: 'card',
    },
  });

  const totalShipping = totalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
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
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
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
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                    </div>
                </div>
                <Button type="submit" size="lg" className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                    Pay {formatCurrency(total)}
                </Button>
                </CardContent>
            </Card>
            </div>

            <div className="lg:order-1 space-y-8">
            <h1 className="font-headline text-3xl font-bold">Checkout</h1>
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
                    <CardContent className="space-y-6">
                        <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedPaymentMethod(value);
                                    }}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                <Label className="rounded-md border-2 border-primary bg-primary/10 p-4 has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value="card" id="card" />
                                            <CreditCard className="h-6 w-6" />
                                            <span>Credit/Debit Card</span>
                                        </div>
                                    </div>
                                </Label>
                                {selectedPaymentMethod === 'card' && (
                                    <div className="p-4 space-y-4">
                                        <FormField name="cardName" render={({ field }) => (
                                            <FormItem><FormLabel>Cardholder Name</FormLabel><FormControl><Input placeholder="Name on card" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="cardNumber" render={({ field }) => (
                                            <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField name="cardExpiry" render={({ field }) => (
                                                <FormItem><FormLabel>Expiry (MM/YY)</FormLabel><FormControl><Input placeholder="MM/YY" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField name="cardCVC" render={({ field }) => (
                                                <FormItem><FormLabel>CVC</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <Label className="flex items-center justify-center rounded-md border p-4 h-14 has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value="applepay" id="applepay" className="sr-only" />
                                        <span>Apple Pay</span>
                                    </Label>
                                    <Label className="flex items-center justify-center rounded-md border p-4 h-14 has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value="googlepay" id="googlepay" className="sr-only" />
                                        <span>Google Pay</span>
                                    </Label>
                                    <Label className="flex items-center justify-center rounded-md border p-4 h-14 has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value="klarna" id="klarna" className="sr-only" />
                                        <span>Klarna</span>
                                    </Label>
                                    <Label className="flex items-center justify-center rounded-md border p-4 h-14 has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value="iris" id="iris" className="sr-only" />
                                        <span>IRIS</span>
                                    </Label>
                                </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </CardContent>
                </Card>
            </div>
        </form>
      </Form>
    </div>
  );
}

    