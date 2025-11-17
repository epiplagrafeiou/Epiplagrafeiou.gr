
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// This is not standard practice for production but follows the project constraints.
// It attempts to use the client SDK on the server side.
function getDb(): Firestore {
  const { firestore } = initializeFirebase();
  return firestore;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cartItems = [], shippingDetails = {}, currency = 'eur', totalAmount } = body;

    // compute amount (in cents)
    const amount = Math.round(totalAmount * 100);

    if (!amount || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    // In a real production app, you would use the Firebase Admin SDK here.
    // Given the constraints, we will proceed without creating a pre-emptive order record,
    // and instead rely on the success page to handle order creation post-payment.
    const orderRefId: string | null = null; 

    // create PaymentIntent with automatic payment methods (Payment Element)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        // orderId will be created on the success page
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
