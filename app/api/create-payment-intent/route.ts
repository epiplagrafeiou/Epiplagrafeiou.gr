// app/api/create-payment-intent/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Optional: import your admin Firestore helper (adjust path to your project)
import { getDb } from "@/lib/firebase-admin"; // <- adapt if different

// Initialize stripe with secret key from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2022-11-15" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cartItems = [], shippingDetails = {}, amount: clientAmount, currency = "eur", guest = false } = body;

    // Compute amount in cents if not provided
    const computedAmount =
      typeof clientAmount === "number"
        ? Math.round(clientAmount)
        : Math.round(
            (cartItems.reduce((acc: number, it: any) => {
              const price = (it.product?.price ?? it.price ?? 0);
              const qty = it.quantity ?? 1;
              return acc + price * qty;
            }, 0)) * 100
          );

    // Create pending order in Firestore (best-effort)
    let orderId: string | null = null;
    try {
      const db = getDb();
      const orderRef = await db.collection("orders").add({
        cartItems,
        shippingDetails,
        total: computedAmount / 100,
        currency,
        status: "pending_payment",
        createdAt: new Date().toISOString(),
        guest: !!guest,
      });
      orderId = orderRef.id;
    } catch (err) {
      console.warn("Could not create Firestore order (continuing):", err);
    }

    // Create PaymentIntent with automatic payment methods (Payment Element + wallets)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: computedAmount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderId ?? "none",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, orderId });
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
