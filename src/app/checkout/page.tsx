
"use client";

import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";
import { useCart } from "@/lib/cart-context";
import { Skeleton } from "@/components/ui/skeleton";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { cartItems, totalAmount } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (totalAmount === 0) {
        setLoading(false);
        return;
    };
    
    let cancelled = false;
    async function createIntent() {
      setLoading(true);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems,
            totalAmount: totalAmount,
            shippingDetails: {}, // Optionally include form data here
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
  }, [cartItems, totalAmount]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-500">Unable to initialize payment. Please check your cart or try again later.</div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' as const },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutPayment clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}
