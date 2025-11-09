
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const FREE_SHIPPING_THRESHOLD = 150;

export default function TopBar() {
  const [isShippingBarVisible, setIsShippingBarVisible] = useState(true);
  const { totalAmount } = useCart();

  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - totalAmount;
  const progressPercentage = (totalAmount / FREE_SHIPPING_THRESHOLD) * 100;

  let shippingMessage;
  if (totalAmount === 0) {
    shippingMessage = `Κέρδισε δωρεάν μεταφορικά για παραγγελίες ${formatCurrency(FREE_SHIPPING_THRESHOLD)}!`;
  } else if (remainingForFreeShipping > 0) {
    shippingMessage = `Πρόσθεσε ακόμη ${formatCurrency(remainingForFreeShipping)} για δωρεάν μεταφορικά!`;
  } else {
    shippingMessage = 'Συγχαρητήρια! Έχεις δωρεάν μεταφορικά!';
  }


  return (
    <div className="text-sm">
      {isShippingBarVisible && (
        <div className="relative flex flex-col items-center justify-center bg-primary p-2 text-primary-foreground">
          <span>{shippingMessage}</span>
           {totalAmount > 0 && totalAmount < FREE_SHIPPING_THRESHOLD && (
            <Progress value={progressPercentage} className="absolute bottom-0 left-0 h-1 w-full rounded-none bg-primary/50" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            onClick={() => setIsShippingBarVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center justify-center border-b border-gray-200 bg-background p-2 text-muted-foreground">
        <span>Γιορτάζουμε 60 χρόνια στον χώρο του επίπλου ! Σας ευχαριστούμε 🎉</span>
      </div>
    </div>
  );
}
