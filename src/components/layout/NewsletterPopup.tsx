
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';

const NEWSLETTER_DISMISSED_TIMESTAMP_KEY = 'newsletter_dismissed_timestamp';
const DISMISSAL_COOLDOWN = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const triggerPopup = useCallback(() => {
    if (isTriggered) return;

    const dismissedTimestamp = localStorage.getItem(NEWSLETTER_DISMISSED_TIMESTAMP_KEY);
    if (dismissedTimestamp && (Date.now() - parseInt(dismissedTimestamp, 10)) < DISMISSAL_COOLDOWN) {
      return;
    }
    
    setIsOpen(true);
    setIsTriggered(true);
  }, [isTriggered]);

  useEffect(() => {
    // Timer-based trigger
    const timer = setTimeout(triggerPopup, 11000); // 11 seconds

    // Scroll-based trigger
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage >= 50) {
        triggerPopup();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [triggerPopup]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Set timestamp when dismissed
      localStorage.setItem(NEWSLETTER_DISMISSED_TIMESTAMP_KEY, Date.now().toString());
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic
    handleOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-8 text-center" onPointerDownOutside={(e) => e.preventDefault()}>
        
        <div className="flex flex-col items-center">
          <Logo className="mb-4" />

          <h2 className="text-2xl font-bold">Καλωσήρθες 🎉</h2>
          <p className="mt-1 text-3xl font-bold">Μόλις κέρδισες έκπτωση -5%</p>
          <p className="mt-2 text-muted-foreground">
            Κανε εγγραφή στο newsletter μας για να πάρεις τον κωδικό
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-6">
          <Input
            type="email"
            placeholder="Email address"
            required
            className="h-12 text-center rounded-full"
          />
           <Input
            type="text"
            placeholder="First name"
            required
            className="h-12 text-center rounded-full"
          />
          <Button type="submit" className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold">
            Αγαπάω να γλιτώνω χρήματα !
          </Button>
        </form>

        <Button variant="link" size="sm" className="mt-2 text-muted-foreground" onClick={() => handleOpenChange(false)}>
            Προτιμώ να πληρώσω όλο το ποσό
        </Button>
        
        <p className="mt-4 text-xs text-muted-foreground px-4">
            *Η προσφορά ισχύει μόνο για νέους χρήστες. Με την παροχή του email σας δέχεστε να λαμβάνετε μηνύματα από το epiplagrafeiou.gr
        </p>

      </DialogContent>
    </Dialog>
  );
}
