// /api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
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

// Helper function to get raw body without micro
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Disable body parsing for webhooks
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  let event: Stripe.Event;
  
  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      console.error('❌ No stripe signature found');
      return res.status(400).send('No stripe signature found');
    }
    
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const email = session.customer_details?.email || session.metadata?.email;

        if (email && customerId && subscriptionId) {
          const userRef = admin.firestore().collection('users').where('email', '==', email).limit(1);
          const snapshot = await userRef.get();
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: 'active',
              trialExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000),
            });
            console.log(`✅ Updated user ${email} with Stripe subscription info`);
          } else {
            console.warn(`⚠️ No user found for email ${email}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(200).json({ received: true });
}