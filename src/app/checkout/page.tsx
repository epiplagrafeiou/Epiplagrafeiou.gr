'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import { Award } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { type UserProfile } from '@/lib/user-actions';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const checkoutSchema = z.object({
  email: z.string().email({ message: 'Το email δεν είναι έγκυρο.' }),
  phone: z.string().min(1, 'Το τηλέφωνο είναι απαραίτητο.'),
  firstName: z.string().min(1, 'Το όνομα είναι απαραίτητο.'),
  lastName: z.string().min(1, 'Το επώνυμο είναι απαραίτητο.'),
  address: z.string().min(1, 'Η διεύθυνση είναι απαραίτητη.'),
  city: z.string().min(1, 'Η πόλη είναι απαραίτητη.'),
  postalCode: z.string().min(1, 'Ο ταχυδρομικός κώδικας είναι απαραίτητος.'),
  country: z.string().min(1, 'Η χώρα είναι απαραίτητη.'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const SHIPPING_COST = 10;
const FREE_SHIPPING_THRESHOLD = 150;

const CheckoutForm = ({ clientSecret }: { clientSecret: string }) => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'Ελλάδα',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    if (user) {
        form.setValue('email', user.email || '');
    }
    if(userProfile) {
        form.setValue('firstName', userProfile.name?.split(' ')[0] || '');
        form.setValue('lastName', userProfile.name?.split(' ').slice(1).join(' ') || '');
    }
  }, [user, userProfile, form]);


  const totalShipping = totalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = totalAmount + totalShipping;
  const pointsEarned = Math.floor(totalAmount * 5);

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!stripe || !elements || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Σφάλμα', description: 'Δεν είναι δυνατή η επεξεργασία της πληρωμής. Παρακαλώ συνδεθείτε και δοκιμάστε ξανά.' });
      return;
    }

    setIsProcessing(true);

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`, // We will handle success/failure manually below
          payment_method_data: {
             billing_details: {
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                phone: data.phone,
                address: {
                line1: data.address,
                city: data.city,
                postal_code: data.postalCode,
                country: 'GR', // Assuming Greece
                },
             }
          }
        },
        // We handle the redirect manually to perform actions after payment
        redirect: 'if_required', 
      });


      if (stripeError) {
        if (stripeError.type === "card_error" || stripeError.type === "validation_error") {
            throw new Error(stripeError.message || 'Υπήρξε ένα σφάλμα με την κάρτα σας.');
        } else {
            throw new Error('Παρουσιάστηκε ένα απρόσμενο σφάλμα κατά την πληρωμή.');
        }
      }

      // If no error, payment is successful
      const ordersRef = collection(firestore, 'orders');
      await addDoc(ordersRef, {
          userId: user.uid,
          customerDetails: {
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              phone: data.phone,
          },
          shippingAddress: {
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              country: data.country,
          },
          items: cartItems,
          total: total,
          shippingCost: totalShipping,
          status: 'Pending',
          createdAt: serverTimestamp(),
      });
      
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
          points: increment(pointsEarned)
      });

      toast({ title: 'Επιτυχία!', description: `Η πληρωμή σας ολοκληρώθηκε. Η παραγγελία σας καταχωρήθηκε.` });
      clearCart();
      router.push('/');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Η πληρωμή απέτυχε',
        description: error.message || 'Παρουσιάστηκε ένα άγνωστο σφάλμα.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
        <div className="lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>Η Παραγγελία Σας</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const image = item.imageId;
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        {image && <Image src={image} alt={item.name} fill className="object-cover" />}
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium">{item.quantity}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{item.name}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Υποσύνολο</span><span>{formatCurrency(totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Μεταφορικά</span><span>{totalShipping > 0 ? formatCurrency(totalShipping) : 'Δωρεάν'}</span></div>
                 {userProfile && (
                    <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                        <Award className="h-4 w-4" /> Υπάρχοντες Πόντοι
                        </span>
                        <span className="font-medium">{userProfile.points}</span>
                    </div>
                 )}
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" /> Πόντοι που θα κερδίσετε
                  </span>
                  <span className="font-medium">{pointsEarned}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold"><span>Σύνολο</span><span>{formatCurrency(total)}</span></div>
              </div>
               <Button type="submit" size="lg" className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isProcessing || !stripe || !elements}>
                 {isProcessing ? 'Επεξεργασία...' : `Πληρωμή ${formatCurrency(total)}`}
               </Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:order-1 space-y-8">
          <h1 className="font-headline text-3xl font-bold">Checkout</h1>
          <Card>
            <CardHeader><CardTitle>Στοιχεία Αποστολής</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Όνομα</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Επώνυμο</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Διεύθυνση</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Πόλη</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="postalCode" render={({ field }) => (<FormItem><FormLabel>Ταχυδρομικός Κώδικας</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Χώρα</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Τηλέφωνο</FormLabel><FormControl><Input placeholder="69..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Στοιχεία Πληρωμής</CardTitle></CardHeader>
            <CardContent>
                <PaymentElement />
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { totalAmount } = useCart();
  const { toast } = useToast();

  const totalShipping = totalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = totalAmount + totalShipping;

  useEffect(() => {
    if (totalAmount > 0) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast({ variant: 'destructive', title: 'Σφάλμα', description: data.error });
        } else {
          setClientSecret(data.clientSecret);
        }
      });
    }
  }, [totalAmount, total, toast]);

  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm clientSecret={clientSecret}/>
        </Elements>
      )}
    </div>
  );
}
