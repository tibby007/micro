// /api/stripe-webhook.ts
console.log('ENV STRIPE_SECRET_KEY', !!process.env.STRIPE_SECRET_KEY);
console.log('ENV STRIPE_WEBHOOK_SECRET', !!process.env.STRIPE_WEBHOOK_SECRET);
console.log('ENV FIREBASE_SERVICE_ACCOUNT', !!process.env.FIREBASE_SERVICE_ACCOUNT);
console.log('ENV FIREBASE_DATABASE_URL', !!process.env.FIREBASE_DATABASE_URL);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  console.log('Firebase initialized');
} catch (err) {
  console.error('Firebase init error:', err);
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buffer } from 'micro';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event types you care about
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Get the email you used for registration
      const email = session.customer_details?.email || session.metadata?.email;

      if (email && customerId && subscriptionId) {
        // Find user in Firestore and update with Stripe info
        const userRef = admin.firestore().collection('users').where('email', '==', email).limit(1);
        const snapshot = await userRef.get();
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            trialExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000), // If you want to set a trial, adjust as needed
          });
          console.log(`✅ Updated user ${email} with Stripe subscription info`);
        } else {
          console.warn(`⚠️ No user found for email ${email}`);
        }
      }
      break;
    }

    // Add more event types here if needed (subscription updates, cancellations, etc)
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}