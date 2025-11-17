
"use client";

import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPayment({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, totalAmount } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePay = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: error.message || "An unexpected error occurred."
      })
      setIsProcessing(false);
    }
    // If no error, Stripe redirects the user to the return_url.
  };

  return (
    <form onSubmit={handlePay} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="lg:order-2">
        <Card>
          <CardHeader>
            <CardTitle>Your order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(cartItems || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      {item.imageId && <Image src={item.imageId} alt={item.name} fill className="object-cover" />}
                       <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium">{item.quantity}</span>
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                    </div>
                  </div>
                  <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="lg:order-1">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <PaymentElement />
            </div>
            <Button disabled={isProcessing || !stripe || !elements} type="submit" className="w-full" size="lg">
              {isProcessing ? "Processing..." : `Pay ${formatCurrency(totalAmount)}`}
            </Button>
             {isProcessing && <p className="text-center text-sm text-muted-foreground mt-2">Please do not close this window. You will be redirected...</p>}
          </CardContent>
        </Card>
      </div>

    </form>
  );
}
