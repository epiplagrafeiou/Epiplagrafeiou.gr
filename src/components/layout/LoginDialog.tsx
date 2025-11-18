'use client';

import { useState } from 'react';
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
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { type UserProfile } from '@/lib/user-actions';

export function LoginDialog({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Επιτυχής Σύνδεση!', description: 'Καλώς ήρθατε πίσω.' });
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Σφάλμα Σύνδεσης', description: error.message });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        email: user.email!,
        name: registerName,
        points: 0,
      };
      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      toast({ title: 'Επιτυχής Εγγραφή!', description: 'Ο λογαριασμός σας δημιουργήθηκε.' });
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Σφάλμα Εγγραφής', description: error.message });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input id="email-login" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Κωδικός</Label>
                <Input id="password-login" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Σύνδεση</Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
             <DialogHeader className="mb-4 text-left">
              <DialogTitle>Δημιουργία Λογαριασμού</DialogTitle>
              <DialogDescription>
                Εγγραφείτε για να απολαμβάνετε προνόμια και γρήγορες αγορές.
              </DialogDescription>
            </DialogHeader>
             <form onSubmit={handleRegister} className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="name-register">Όνομα</Label>
                <Input id="name-register" type="text" placeholder="Το όνομά σας" value={registerName} onChange={(e) => setRegisterName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-register">Email</Label>
                <Input id="email-register" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">Κωδικός</Label>
                <Input id="password-register" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Εγγραφή</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}