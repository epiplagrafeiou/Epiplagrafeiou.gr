
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
        
        <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full max-w-xl mx-auto">
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
            <TabsContent value="stripe">
                {renderStripeForm()}
            </TabsContent>
            <TabsContent value="bank_transfer">
                <BankTransferFlow />
            </TabsContent>
        </Tabs>
    </div>
  );
}
