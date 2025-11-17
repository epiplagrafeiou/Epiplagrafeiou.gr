"use client";

import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function CheckoutPage() {
  const { cartItems, totalAmount } = useCart();
  const { user, isUserLoading } = useUser();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return; // wait for auth readiness
    let cancelled = false;
    async function createIntent() {
      setLoading(true);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems,
            amount: Math.round((totalAmount ?? 0) * 100), // cents
            currency: "eur",
            shippingDetails: {}, // optionally include prefilled shipping if you have it
            guest: !user,
          }),
        });
        const data = await res.json();
        if (!cancelled) setClientSecret(data.clientSecret ?? null);
      } catch (err) {
        console.error("create-payment-intent failed", err);
        if (!cancelled) setClientSecret(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    createIntent();
    return () => { cancelled = true; };
  }, [cartItems, totalAmount, user, isUserLoading]);

  if (isUserLoading) {
    return <div className="py-20 text-center">Φόρτωση λογαριασμού...</div>;
  }

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
        <div className="text-center text-destructive">Unable to initialize payment. Try again later.</div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: { theme: "stripe" },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutPayment clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}
