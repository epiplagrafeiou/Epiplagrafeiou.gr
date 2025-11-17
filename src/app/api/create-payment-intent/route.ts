
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cartItems = [], totalAmount, shippingDetails = {} } = body;

    // Use client-side initialization as per project constraints
    const { firestore } = initializeFirebase();

    // compute amount (in cents)
    const amount = Math.round(totalAmount * 100);
     if (!amount || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }


    // create pending order in Firestore
    let orderRefId: string | null = null;
    try {
        const orderRef = await addDoc(collection(firestore, "orders"), {
            items: cartItems,
            shippingDetails, // This will be empty for now, can be populated from a form
            total: amount / 100,
            status: "pending_payment",
            createdAt: serverTimestamp(),
        });
        orderRefId = orderRef.id;
    } catch (err) {
      console.warn("Could not create Firestore order (continuing without it):", err);
    }

    // create PaymentIntent with automatic payment methods (Payment Element)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderRefId ?? "unknown",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
