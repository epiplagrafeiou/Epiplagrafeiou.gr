
// components/checkout/CheckoutPayment.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Image from "next/image";

interface Props { clientSecret: string; }

export default function CheckoutPayment({ clientSecret }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, totalAmount } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "An unexpected error occurred.");
    } else {
      setMessage("An unexpected error occurred.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Στοιχεία Πληρωμής</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <PaymentElement id="payment-element" />
                     {message && <div id="payment-message" className="text-destructive text-sm mt-4">{message}</div>}
                    <Button disabled={isProcessing || !stripe || !elements} type="submit" className="w-full mt-6" size="lg">
                        <span id="button-text">
                        {isProcessing ? "Επεξεργασία..." : `Πληρωμή ${formatCurrency(totalAmount)}`}
                        </span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
