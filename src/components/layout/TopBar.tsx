'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const FREE_SHIPPING_THRESHOLD = 150;

export default function TopBar() {
  const [isVisible, setIsVisible] = useState(true);
  const { totalAmount } = useCart();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, ensuring the component's
    // state is determined after the initial server render.
    setIsClient(true);
  }, []);

  // By returning null until isClient is true, we ensure that the server-rendered
  // output matches the initial client render, preventing the hydration error.
  if (!isClient) {
    return (
        <div className="relative z-50 h-10 text-sm text-primary-foreground bg-primary">
            {/* This acts as a placeholder to prevent layout shift during client-side hydration */}
        </div>
    );
  }
  
  if (!isVisible) {
    return (
        <div className="relative z-50 h-10 text-sm text-primary-foreground bg-primary" />
    );
  }


  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - totalAmount;
  const progressPercentage = (totalAmount / FREE_SHIPPING_THRESHOLD) * 100;

  let shippingMessage;
  if (totalAmount === 0) {
    shippingMessage = `Κέρδισε δωρεάν μεταφορικά για παραγγελίες άνω των ${formatCurrency(FREE_SHIPPING_THRESHOLD)}!`;
  } else if (remainingForFreeShipping > 0) {
    shippingMessage = `Πρόσθεσε ακόμη ${formatCurrency(remainingForFreeShipping)} για δωρεάν μεταφορικά!`;
  } else {
    shippingMessage = 'Συγχαρητήρια! Έχεις δωρεάν μεταφορικά!';
  }

  return (
    <div className="relative z-50 text-sm text-primary-foreground bg-primary">
      <div className="container mx-auto flex h-10 items-center justify-center text-center">
        <span>{shippingMessage}</span>
      </div>
      {totalAmount > 0 && totalAmount < FREE_SHIPPING_THRESHOLD && (
        <Progress value={progressPercentage} className="absolute bottom-0 left-0 h-1 w-full rounded-none bg-primary/50" />
      )}
    </div>
  );
}
