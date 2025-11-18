
'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const bankAccounts = [
    { bank: 'Εθνική Τράπεζα', iban: 'GR1234567890123456789012345', holder: 'Ανδρέας Γιωργαράς' },
    { bank: 'Τράπεζα Πειραιώς', iban: 'GR9876543210987654321098765', holder: 'Ανδρέας Γιωργαράς' },
]

export function BankTransferFlow() {
    const { cartItems, totalAmount, clearCart } = useCart();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmOrder = async () => {
        if (!firestore) {
            setError("Database connection not available.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const orderData = {
                items: cartItems.map(item => ({...item, slug: undefined, imageId: undefined, images: undefined})), // Clean up product data for order
                total: totalAmount,
                status: 'Pending Payment',
                paymentMethod: 'Bank Transfer',
                createdAt: serverTimestamp(),
                // Add customer details if you have a form for them
                customerDetails: {
                    name: 'Guest Customer', // Placeholder
                    email: 'guest@example.com' // Placeholder
                }
            };
            
            const ordersCollection = collection(firestore, 'orders');
            const newOrderRef = await addDoc(ordersCollection, orderData);

            toast({
                title: "Η Παραγγελία Καταχωρήθηκε!",
                description: "Ελέγξτε το email σας για οδηγίες πληρωμής.",
            });
            
            clearCart();
            
            router.push(`/checkout/success?method=bank_transfer&order_id=${newOrderRef.id}`);

        } catch (e: any) {
            console.error("Failed to create order:", e);
            setError("Could not create the order. Please try again.");
            toast({
                variant: "destructive",
                title: "Σφάλμα",
                description: "Δεν ήταν δυνατή η δημιουργία της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.",
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Οδηγίες Πληρωμής</CardTitle>
                <CardDescription>
                    Παρακαλούμε καταθέστε το συνολικό ποσό σε έναν από τους παρακάτω λογαριασμούς,
                    αναγράφοντας τον κωδικό παραγγελίας σας ως αιτιολογία.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {bankAccounts.map(account => (
                    <div key={account.iban} className="rounded-md border p-4">
                        <p className="font-semibold">{account.bank}</p>
                        <p className="text-sm text-muted-foreground">IBAN: <span className="font-mono">{account.iban}</span></p>
                        <p className="text-sm text-muted-foreground">Δικαιούχος: {account.holder}</p>
                    </div>
                ))}
                <Alert>
                    <AlertTitle>Σημαντικό!</AlertTitle>
                    <AlertDescription>
                        Η παραγγελία σας θα αποσταλεί μόλις επιβεβαιωθεί η πληρωμή. Αυτό μπορεί να διαρκέσει 1-2 εργάσιμες ημέρες.
                    </AlertDescription>
                </Alert>
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-4">
                 <div className="flex justify-between font-bold text-lg border-t pt-4">
                    <span>Συνολικό Ποσό:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>
                <Button onClick={handleConfirmOrder} disabled={isLoading || cartItems.length === 0} className="w-full" size="lg">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Καταχώρηση..." : "Επιβεβαίωση Παραγγελίας & Ολοκλήρωση"}
                </Button>
            </CardFooter>
        </Card>
    );
}
