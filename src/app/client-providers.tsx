'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AppContent } from './AppContent';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      {/* AppContent now wraps the children and contains all other providers */}
      <AppContent>
        {children}
      </AppContent>
    </FirebaseClientProvider>
  );
}
