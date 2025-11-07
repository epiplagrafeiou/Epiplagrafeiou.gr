'use client';

import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const FREE_DELIVERY_THRESHOLD = 150;

export default function FreeDeliveryProgressBar() {
  const { totalAmount, itemCount } = useCart();

  if (itemCount === 0) {
    return null;
  }

  const progress = Math.min((totalAmount / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remainingAmount = FREE_DELIVERY_THRESHOLD - totalAmount;

  return (
    <div className="border-b bg-secondary/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <div className="w-full text-center">
            {remainingAmount > 0 ? (
              <p className="text-sm font-medium">
                Add{' '}
                <span className="font-bold text-accent">
                  {formatCurrency(remainingAmount)}
                </span>{' '}
                more to get FREE delivery!
              </p>
            ) : (
              <p className="text-sm font-bold text-accent">
                🎉 You've unlocked FREE delivery!
              </p>
            )}
            <Progress value={progress} className="mt-2 h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
