
"use client";

import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";
import { useCart } from "@/lib/cart-context";
import { Skeleton } from "@/components/ui/skeleton";
import { BankTransferFlow } from "@/components/checkout/BankTransferFlow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { cartItems, totalAmount } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  useEffect(() => {
    if (totalAmount === 0 && cartItems.length === 0) {
        setLoading(false);
        return;
    };
    
    // Only create a payment intent if stripe is the selected method
    if (paymentMethod !== 'stripe') {
      setClientSecret(null);
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    async function createIntent() {
      setLoading(true);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: totalAmount,
          }),
        });
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        }
        if (!cancelled) setClientSecret(data.clientSecret ?? null);
      } catch (err) {
        console.error("create-payment-intent failed", err);
        if (!cancelled) setClientSecret(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    createIntent();
    return () => {
      cancelled = true;
    };
  }, [cartItems, totalAmount, paymentMethod]);


  const renderStripeForm = () => {
    if (loading) {
       return (
        <div className="space-y-4 mt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    if (!clientSecret) {
      return (
        <div className="mt-4 text-center text-destructive">Unable to initialize card payment. Please select another method or try again.</div>
      );
    }
    
    const options: StripeElementsOptions = {
      clientSecret,
      appearance: { theme: 'stripe' },
    };

    return (
      <Elements stripe={stripePromise} options={options}>
        <CheckoutPayment clientSecret={clientSecret!} />
      </Elements>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Ολοκλήρωση Παραγγελίας</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="lg:col-span-1">
                <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="stripe">
                            <CreditCard className="mr-2 h-4 w-4"/>
                            Κάρτα / IRIS / Apple Pay
                        </TabsTrigger>
                        <TabsTrigger value="bank_transfer">
                            <Landmark className="mr-2 h-4 w-4" />
                            Τραπεζική Κατάθεση
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="stripe" className="mt-6">
                        {renderStripeForm()}
                    </TabsContent>
                    <TabsContent value="bank_transfer" className="mt-6">
                        <BankTransferFlow />
                    </TabsContent>
                </Tabs>
            </div>
             <div className="lg:col-span-1">
                <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle>Σύνοψη Παραγγελίας</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 rounded-md bg-secondary overflow-hidden">
                                        <Image src={item.imageId} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">x {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="flex-col items-stretch space-y-2 border-t pt-6">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Υποσύνολο</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Σύνολο</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
