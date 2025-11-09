
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Σύνδεση</TabsTrigger>
            <TabsTrigger value="register">Εγγραφή</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle>Σύνδεση</DialogTitle>
              <DialogDescription>
                Καλώς ήρθατε πίσω! Συνδεθείτε για να συνεχίσετε.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input id="email-login" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Κωδικός</Label>
                <Input id="password-login" type="password" />
              </div>
              <Button className="w-full">Σύνδεση</Button>
            </div>
          </TabsContent>
          <TabsContent value="register">
             <DialogHeader className="mb-4 text-left">
              <DialogTitle>Δημιουργία Λογαριασμού</DialogTitle>
              <DialogDescription>
                Εγγραφείτε για να απολαμβάνετε προνόμια και γρήγορες αγορές.
              </DialogDescription>
            </DialogHeader>
             <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-register">Email</Label>
                <Input id="email-register" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">Κωδικός</Label>
                <Input id="password-register" type="password" />
              </div>
              <Button className="w-full">Εγγραφή</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
