// /api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro'; // For raw body parsing

// Setup Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is required for raw body parsing with Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main webhook handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  let event;
  try {
    // Get raw body
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret!);
  } catch (err: any) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Your logic here (e.g., update Firestore, unlock access, etc.)
      console.log('✅ Checkout complete:', session.id);
      break;
    }
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      // TODO: Your logic here
      console.log('✅ Subscription created:', sub.id);
      break;
    }
    // Add more cases as needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to Stripe
  res.status(200).json({ received: true });
}
