
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TopBar() {
  const [isShippingBarVisible, setIsShippingBarVisible] = useState(true);

  return (
    <div className="text-sm">
      {isShippingBarVisible && (
        <div className="relative flex items-center justify-center bg-primary p-2 text-primary-foreground">
          <span>Κέρδισε δωρεάν μεταφορικά για παραγγελίες €150,00!</span>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 h-6 w-6 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
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
