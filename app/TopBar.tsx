
'use client';

import { useState, useEffect } from 'react';
import { X, Star, Truck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const FREE_SHIPPING_THRESHOLD = 150;

const trustMessages = [
    {
        Icon: Star,
        text: '4.9/5 Αξιολόγηση από 86+ κριτικές'
    },
    {
        Icon: Award,
        text: '60 χρόνια εμπειρίας, η σφραγίδα της σιγουριάς μας'
    }
]

export default function TopBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const { totalAmount } = useCart();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % trustMessages.length);
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
  
  if (!isVisible) return null;

  return (
    <div className="text-sm bg-background relative">
      <div className="relative flex flex-col items-center justify-center bg-primary p-2 text-primary-foreground text-center">
        <span>{shippingMessage}</span>
         {totalAmount > 0 && totalAmount < FREE_SHIPPING_THRESHOLD && (
          <Progress value={progressPercentage} className="absolute bottom-0 left-0 h-1 w-full rounded-none bg-primary/50" />
        )}
      </div>

      <div className="flex h-10 items-center justify-center border-b border-gray-200 bg-secondary/80 text-muted-foreground px-10">
        <div key={currentMessageIndex} className="flex animate-in fade-in-50 slide-in-from-bottom-2 duration-500 items-center gap-2 text-center">
            {(() => {
                const CurrentIcon = trustMessages[currentMessageIndex].Icon;
                return <CurrentIcon className="h-4 w-4 text-primary" />;
            })()}
            <span>{trustMessages[currentMessageIndex].text}</span>
        </div>
        <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            onClick={() => setIsVisible(false)}
            aria-label="Close top bar"
        >
            <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
