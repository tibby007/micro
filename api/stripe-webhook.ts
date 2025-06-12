// /api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro'; // If using Next.js API routes, use buffer for raw body
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false, // Stripe webhooks require the raw body
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  let event;
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(buf, sig as string, endpointSecret!);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed':
      // Find user by email or stripe customer id in Firestore, update them
      const email = data.customer_email;
      const subscriptionId = data.subscription;

      // Example: update user in Firestore
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (!snapshot.empty) {
        snapshot.forEach(async doc => {
          await doc.ref.update({
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
          });
        });
        res.status(200).json({ received: true });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
      break;

    default:
      res.status(200).json({ received: true });
      break;
  }
}
