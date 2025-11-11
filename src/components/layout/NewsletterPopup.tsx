
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

const NEWSLETTER_POPUP_DISMISSED_KEY = 'newsletter_popup_dismissed';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(NEWSLETTER_POPUP_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      sessionStorage.setItem(NEWSLETTER_POPUP_DISMISSED_KEY, 'true');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic
    handleOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-8 text-center">
        <button
            onClick={() => handleOpenChange(false)}
            className="absolute right-4 top-4 h-8 w-8 rounded-full bg-yellow-400 text-black flex items-center justify-center transition-opacity hover:opacity-80"
        >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
        </button>
        
        <div className="flex flex-col items-center">
          <Logo className="mb-4" />

          <h2 className="text-2xl font-bold">Καλωσήρθες 🙌</h2>
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
            className="h-12 text-center"
          />
           <Input
            type="text"
            placeholder="First name"
            required
            className="h-12 text-center"
          />
          <Button type="submit" className="h-12 bg-black text-white hover:bg-gray-800 text-lg font-bold">
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
