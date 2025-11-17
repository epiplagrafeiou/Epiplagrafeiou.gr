const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const { db } = require("./firebase-admin");
const Stripe = require("stripe");

// Set global options for all functions, e.g., region.
setGlobalOptions({ region: "europe-west1" });

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/**
 * A Cloud Function that triggers when a new order is created in Firestore.
 * It creates a corresponding Stripe PaymentIntent.
 *
 * NOTE: This function is not directly used by the client-side flow you provided,
 * which uses an HTTP endpoint. This is an alternative, more backend-driven approach.
 * The HTTP endpoint in `app/api/create-payment-intent/route.ts` is what is
 * currently active. This function serves as an example of a Firestore-triggered
 * function.
 */
exports.createStripePayment = onDocumentCreated(
  {
    document: "orders/{orderId}",
    // This tells the function to load the SERVICE_ACCOUNT_JSON secret
    // into its environment variables. The Admin SDK will use it automatically.
    secrets: ["SERVICE_ACCOUNT_JSON"],
  },
  async (event) => {
    const orderData = event.data.data();
    const orderId = event.params.orderId;

    logger.info(`Creating PaymentIntent for order: ${orderId}`, {
      structuredData: true,
    });

    const amount = Math.round(orderData.total * 100); // Amount in cents

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: orderId,
        },
      });

      // Update the order document with the PaymentIntent's client secret
      await event.data.ref.update({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      });

      logger.info(
        `Successfully created PaymentIntent ${paymentIntent.id} for order ${orderId}`
      );

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      logger.error(
        `Failed to create PaymentIntent for order ${orderId}:`,
        error
      );
      // Optionally update the order status to 'failed'
      await event.data.ref.update({ status: "payment_failed" });
      return { success: false, error: error.message };
    }
  }
);
