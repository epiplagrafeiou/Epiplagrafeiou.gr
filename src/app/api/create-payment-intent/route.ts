
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
        cartItems = [], 
        totalAmount, 
        customerDetails,
        shippingAddress,
        companyDetails,
        userId
    } = body;

    const amount = Math.round(totalAmount * 100);

    if (!amount || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    // Create a pending order in Firestore
    let orderId: string | null = null;
    try {
      const db = getDb();
      const orderData = {
        userId,
        customerDetails,
        shippingAddress,
        companyDetails: companyDetails || null,
        items: cartItems,
        total: totalAmount,
        status: 'pending_payment',
        createdAt: new Date(),
        paymentMethod: 'stripe'
      };

      const orderRef = await db.collection("orders").add(orderData);
      orderId = orderRef.id;
    } catch (err) {
      console.error("Could not create Firestore order (continuing):", err);
    }
    

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderId ?? 'N/A',
        customerEmail: customerDetails?.email || 'N/A'
      }
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId });
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
