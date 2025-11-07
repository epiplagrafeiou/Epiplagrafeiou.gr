'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

const NEWSLETTER_POPUP_DISMISSED_KEY = 'newsletter_popup_dismissed';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(NEWSLETTER_POPUP_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 10000); // 10 seconds

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Mail className="h-8 w-8 text-accent" />
            Get 5% Off!
          </DialogTitle>
          <DialogDescription className="pt-2">
            Join our newsletter and get a 5% discount on your first order. Plus, get updates on new arrivals and special offers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">
          <Input
            type="email"
            placeholder="Enter your email"
            required
            className="h-11"
          />
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Subscribe & Get Discount
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
