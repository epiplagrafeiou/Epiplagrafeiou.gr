
import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Stripe from 'stripe';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = "force-dynamic";

async function VerificationContent({ paymentIntentId }: { paymentIntentId: string }) {
    let paymentIntent: Stripe.PaymentIntent | null = null;
    let errorMessage: string | null = null;

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2024-06-20',
        });
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment not successful.');
        }

    } catch (err: any) {
        console.error("Success page error:", err);
        errorMessage = err.message || "An unknown error occurred while verifying your payment.";
    }

    if (errorMessage || !paymentIntent) {
        return (
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>There was an issue verifying your payment. Please contact support and provide the following reference:</p>
                    <p className="mt-4 bg-muted p-2 rounded-md font-mono text-sm break-all">
                        {paymentIntentId}
                    </p>
                    {errorMessage && <p className="mt-2 text-destructive">{errorMessage}</p>}
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full max-w-lg mx-auto text-center">
            <CardHeader className="items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-2xl">Thank You! Payment Successful</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Your payment was successful and your order is now confirmed. A confirmation email has been sent to you.</p>
                <div className="text-left bg-secondary p-4 rounded-md text-sm">
                    <p><strong>Amount Paid:</strong> {formatCurrency((paymentIntent.amount || 0) / 100)}</p>
                    <p><strong>Payment Reference:</strong> <code className="font-mono">{paymentIntent.id}</code></p>
                </div>
                 <Button asChild className="mt-6">
                    <Link href="/">Return to Homepage</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

// Helper function to format currency, as it can't be imported in server components easily without context
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}


export default function CheckoutSuccessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const paymentIntentId = searchParams?.payment_intent as string | undefined;

  if (!paymentIntentId) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Suspense fallback={<div>Loading payment details...</div>}>
            <VerificationContent paymentIntentId={paymentIntentId} />
        </Suspense>
    </div>
  );
}
