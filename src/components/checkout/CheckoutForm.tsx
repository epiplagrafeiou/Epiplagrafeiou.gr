'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const checkoutSchema = z
  .object({
    name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό.'),
    email: z
      .string()
      .min(1, 'Το email είναι υποχρεωτικό.')
      .email('Μη έγκυρη διεύθυνση email.'),
    phone: z.string().min(10, 'Απαιτείται έγκυρος αριθμός τηλεφώνου.'),
    address: z.string().min(1, 'Η διεύθυνση είναι υποχρεωτική.'),
    city: z.string().min(1, 'Η πόλη είναι υποχρεωτική.'),
    postalCode: z.string().min(1, 'Ο ταχυδρομικός κώδικας είναι υποχρεωτικός.'),
    country: z.string().min(1, 'Η χώρα είναι υποχρεωτική.'),
    wantsInvoice: z.boolean().default(false),
    companyName: z.string().optional(),
    companyVat: z.string().optional(),
    companyTaxOffice: z.string().optional(),
    companyAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.wantsInvoice) {
        return (
          !!data.companyName &&
          !!data.companyVat &&
          !!data.companyTaxOffice &&
          !!data.companyAddress
        );
      }
      return true;
    },
    {
      message:
        'Όλα τα πεδία τιμολόγησης είναι υποχρεωτικά όταν επιλέγεται η έκδοση τιμολογίου.',
      path: ['companyName'], // Attach error to a specific field for display
    }
  );

export type CheckoutDetails = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  onSubmit: (data: CheckoutDetails) => void;
}

export function CheckoutForm({ onSubmit }: CheckoutFormProps) {
  const form = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'Greece',
      wantsInvoice: false,
    },
  });

  const wantsInvoice = form.watch('wantsInvoice');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Στοιχεία Αποστολής &amp; Τιμολόγησης</CardTitle>
        <CardDescription>
          Συμπληρώστε τα στοιχεία σας για να ολοκληρώσετε την παραγγελία.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ονοματεπώνυμο</FormLabel>
                    <FormControl>
                      <Input placeholder="π.χ. Νίκος Παπαδόπουλος" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        {...field}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Τηλέφωνο</FormLabel>
                  <FormControl>
                    <Input placeholder="π.χ. 6912345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Διεύθυνση</FormLabel>
                  <FormControl>
                    <Input placeholder="π.χ. Ερμού 25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Πόλη</FormLabel>
                    <FormControl>
                      <Input placeholder="π.χ. Αθήνα" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Τ.Κ.</FormLabel>
                    <FormControl>
                      <Input placeholder="π.χ. 10563" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Χώρα</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="wantsInvoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Επιθυμώ έκδοση τιμολογίου</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {wantsInvoice && (
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Στοιχεία Τιμολόγησης</h3>
                 <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Επωνυμία Εταιρείας</FormLabel>
                      <FormControl>
                        <Input placeholder="Επωνυμία" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="companyVat"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>ΑΦΜ</FormLabel>
                        <FormControl>
                            <Input placeholder="Αριθμός Φορολογικού Μητρώου" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="companyTaxOffice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>ΔΟΥ</FormLabel>
                        <FormControl>
                            <Input placeholder="π.χ. ΔΟΥ Α' Αθηνών" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Έδρα Εταιρείας</FormLabel>
                      <FormControl>
                        <Input placeholder="Διεύθυνση έδρας" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              Συνέχεια στην Πληρωμή
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
