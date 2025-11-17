
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { totalAmount } = body;

    // compute amount (in cents)
    const amount = Math.round(totalAmount * 100);

    if (!amount || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    // create PaymentIntent with automatic payment methods (Payment Element)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
