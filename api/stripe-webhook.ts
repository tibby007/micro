import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buffer } from 'micro';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// ENV
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT!;
const firebaseDatabaseUrl = process.env.FIREBASE_DATABASE_URL;

// Firebase Admin Init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(firebaseServiceAccount)),
    databaseURL: firebaseDatabaseUrl,
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const email =
        session.customer_details?.email ||
        session.metadata?.email ||
        (session as any).customer_email ||
        null;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!email || !customerId || !subscriptionId) {
        console.warn(
          `⚠️ Missing one or more values: email=${email}, customerId=${customerId}, subscriptionId=${subscriptionId}`
        );
        break;
      }

      // Firestore: Find user by email
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (!snapshot.empty) {
        // Update existing
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          trialExpiresAt: admin.firestore.Timestamp.fromMillis(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ),
        });
        console.log(`✅ Updated user ${email} with Stripe subscription info`);
      } else {
        // Create new
        await usersRef.add({
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          trialExpiresAt: admin.firestore.Timestamp.fromMillis(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Created user ${email} with Stripe subscription info`);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}
