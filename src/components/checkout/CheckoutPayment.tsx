'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { type CheckoutDetails } from './CheckoutForm';

interface Props {
  clientSecret: string;
  checkoutDetails: CheckoutDetails;
}

export default function CheckoutPayment({ clientSecret, checkoutDetails }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { totalAmount, cartItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setIsProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?method=stripe`,
      },
    });

    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'An unexpected error occurred.');
    } else {
      setMessage('An unexpected error occurred.');
    }
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Στοιχεία Πληρωμής</CardTitle>
        <CardDescription>
          Συμπληρώστε τα στοιχεία της κάρτας σας. Η συναλλαγή είναι ασφαλής.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" />
          {message && (
            <div id="payment-message" className="mt-4 text-sm text-destructive">
              {message}
            </div>
          )}
          <Button
            disabled={isProcessing || !stripe || !elements}
            type="submit"
            className="mt-6 w-full"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            <span id="button-text">
              {isProcessing
                ? 'Επεξεργασία...'
                : `Πληρωμή ${formatCurrency(totalAmount)}`}
            </span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
