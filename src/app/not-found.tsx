
'use client';

import { Button } from '@/components/ui/button';
import { PackageX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <PackageX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
        Σελίδα δεν βρέθηκε
      </h1>
      <p className="mt-6 text-base leading-7 text-muted-foreground">
        Ουπς! Δεν μπορούμε να βρούμε τη σελίδα που ψάχνετε.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/">Επιστροφή στην Αρχική</Link>
        </Button>
        <Button variant="outline" asChild>
           <Link href="/products">Δείτε όλα τα προϊόντα &rarr;</Link>
        </Button>
      </div>
    </div>
  );
}
