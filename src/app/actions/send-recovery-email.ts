'use server';

import { Resend } from 'resend';
import AbandonedCartEmail from '@/emails/abandoned-cart-email';
import { type CartItem } from '@/lib/cart-context';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendRecoveryEmailParams {
  to: string;
  customerFirstName: string;
  cartItems: CartItem[];
  cartTotal: string;
}

export async function sendRecoveryEmail({
  to,
  customerFirstName,
  cartItems,
  cartTotal,
}: SendRecoveryEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Epipla Grafeiou <sales@epiplagrafeiou.gr>',
      to: [to],
      subject: 'Μην ξεχάσεις το καλάθι σου!',
      react: AbandonedCartEmail({
        customerFirstName,
        cartItems,
        cartTotal,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Caught exception sending email:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
}
