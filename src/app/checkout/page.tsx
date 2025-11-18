
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { useCart } from '@/lib/cart-context';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckoutForm, type CheckoutDetails } from '@/components/checkout/CheckoutForm';
import CheckoutPayment from '@/components/checkout/CheckoutPayment';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const { cartItems, totalAmount } = useCart();
  const { user } = useUser();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [checkoutDetails, setCheckoutDetails] =
    useState<CheckoutDetails | null>(null);

  const createPaymentIntent = useCallback(
    async (details: CheckoutDetails) => {
      setLoading(true);
      setCheckoutDetails(details);
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems,
            totalAmount: totalAmount,
            customerDetails: {
              name: details.name,
              email: details.email,
              phone: details.phone,
            },
            shippingAddress: {
              address: details.address,
              city: details.city,
              postalCode: details.postalCode,
              country: details.country,
            },
            companyDetails: details.wantsInvoice
              ? {
                  name: details.companyName,
                  vat: details.companyVat,
                  taxOffice: details.companyTaxOffice,
                  address: details.companyAddress,
                }
              : null,
            userId: user?.uid ?? null,
          }),
        });
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret ?? null);
        setStep('payment');
      } catch (err) {
        console.error('create-payment-intent failed', err);
        setClientSecret(null);
        // Optionally move back to details step or show an error
        setStep('details');
      } finally {
        setLoading(false);
      }
    },
    [cartItems, totalAmount, user]
  );
  
  const handleDetailsSubmit = (data: CheckoutDetails) => {
    createPaymentIntent(data);
  };

  const renderContent = () => {
    if (step === 'details') {
      return <CheckoutForm onSubmit={handleDetailsSubmit} />;
    }

    if (step === 'payment') {
      if (loading) {
        return <Skeleton className="h-96 w-full" />;
      }
      if (!clientSecret || !checkoutDetails) {
        return (
          <div className="text-center">
            <p className="text-destructive">
              Error initializing payment. Please try again.
            </p>
            <Button onClick={() => setStep('details')} className="mt-4">
              Go Back
            </Button>
          </div>
        );
      }
      const options: StripeElementsOptions = {
        clientSecret,
        appearance: { theme: 'stripe' },
      };
      return (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutPayment clientSecret={clientSecret} checkoutDetails={checkoutDetails} />
        </Elements>
      );
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">
        {step === 'details' ? 'Στοιχεία Αποστολής' : 'Πληρωμή'}
      </h1>
      {renderContent()}
    </div>
  );
}
