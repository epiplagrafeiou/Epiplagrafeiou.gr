// components/checkout/CheckoutPayment.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props { clientSecret: string; }

export default function CheckoutPayment({ clientSecret }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequestSupported, setPaymentRequestSupported] = useState(false);
  const [prInstance, setPrInstance] = useState<any>(null);
  const total = totalAmount ?? cartItems.reduce((s, i: any) => s + (i.product?.price ?? i.price ?? 0) * (i.quantity ?? 1), 0);

  // create PaymentRequest for Apple/Google Pay
  useEffect(() => {
    if (!stripe || !window) return;

    const pr = stripe.paymentRequest({
      country: "GR",
      currency: "eur",
      total: {
        label: "Total",
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequestSupported(true);
        setPrInstance(pr);
      } else {
        setPaymentRequestSupported(false);
      }
    });

    // cleanup not strictly necessary
    return () => {
      try { pr?.destroy?.(); } catch (_) {}
    };
  }, [stripe, total]);

  // PaymentRequest flow handler
  useEffect(() => {
    if (!prInstance || !stripe) return;

    const handlePR = async (ev: any) => {
      try {
        // create a PaymentIntent server-side (we already have clientSecret root-level; we'll reuse it)
        // For PaymentRequest flow we confirm server-side using payment method from the event
        const paymentMethod = ev.paymentMethod?.id;

        // If event provides payment method token, confirm with PaymentIntent
        // We need a fresh client secret — create a tiny PaymentIntent (or re-use existing) server-side if needed.
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems,
            amount: Math.round(total * 100),
            currency: "eur",
            shippingDetails: {},
            guest: !user,
          }),
        });
        const data = await res.json();
        const clientSecretPR = data.clientSecret;

        // Confirm using the payment method provided by the browser
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecretPR,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          ev.complete("fail");
          console.error("PaymentRequest confirm error", error);
          return;
        }

        // If requires action -> handle it
        if (paymentIntent && paymentIntent.status === "requires_action") {
          const { error: finalError } = await stripe.confirmCardPayment(clientSecretPR);
          if (finalError) {
            ev.complete("fail");
            return;
          }
        }

        ev.complete("success");
        // redirect to success page (Stripe usually handles redirects, but ensure)
        router.push(`/checkout/success?payment_intent=${paymentIntent?.id ?? data.paymentIntentId}`);
        clearCart();
      } catch (err) {
        console.error("PaymentRequest flow error", err);
        try { ev.complete("fail"); } catch (_) {}
      }
    };

    prInstance.on("paymentmethod", handlePR);

    return () => {
      try {
        prInstance.off && prInstance.off("paymentmethod", handlePR);
      } catch (_) {}
    };
  }, [prInstance, stripe, cartItems, total, user, router, clearCart]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    try {
      // If Payment Element is used (wallets + many methods), prefer confirmPayment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        console.error("Stripe confirmPayment error:", error);
        alert(error.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      // confirmPayment will redirect; if not, we can still show success message after redirect back
    } catch (err) {
      console.error("Submit error", err);
      alert("Payment failed. Try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Payment Method</h2>

          {/* PaymentRequest button (Apple/Google Pay) */}
          {paymentRequestSupported && prInstance ? (
            <div className="mb-4">
              <PaymentRequestButtonElement options={{ paymentRequest: prInstance }} />
            </div>
          ) : null}

          {/* Payment Element gives aggregated wallets / bank methods */}
          <div className="border p-4 rounded-md mb-4">
            <PaymentElement />
          </div>

          <h3 className="font-medium mb-2">Or pay with card</h3>
          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <div className="text-sm mb-1">Name on card</div>
              <input name="cardName" id="cardName" className="w-full rounded-md border px-3 py-2" placeholder="Cardholder name" />
            </label>

            <label className="block">
              <div className="text-sm mb-1">Card number</div>
              <div className="rounded-md border p-2">
                <CardNumberElement options={{ style: { base: { fontSize: "16px" } } }} />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-sm mb-1">Expiry</div>
                <div className="rounded-md border p-2">
                  <CardExpiryElement options={{ style: { base: { fontSize: "16px" } } }} />
                </div>
              </label>

              <label className="block">
                <div className="text-sm mb-1">CVC</div>
                <div className="rounded-md border p-2">
                  <CardCvcElement options={{ style: { base: { fontSize: "16px" } } }} />
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <Button disabled={isProcessing || !stripe || !elements} type="submit" className="w-full">
              {isProcessing ? "Processing..." : `Pay ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </div>

      <aside>
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-3">Order summary</h3>
          <div className="space-y-3">
            {cartItems.map((it: any) => (
              <div key={it.id} className="flex justify-between">
                <div>
                  <div className="font-medium">{it.product?.name ?? it.name}</div>
                  <div className="text-sm text-muted-foreground">x{it.quantity}</div>
                </div>
                <div className="font-medium">{formatCurrency((it.product?.price ?? it.price ?? 0) * (it.quantity ?? 1))}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
