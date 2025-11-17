import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    if (!amount || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    // Creating a Payment Intent without automatic_payment_methods
    // to be used with manual card element confirmation.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
