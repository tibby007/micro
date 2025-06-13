// /api/stripe-webhook.ts

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
  console.log('🔔 Stripe webhook called!', req.method);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;
    console.log('🔐 Verifying webhook signature...');
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log('✅ Webhook signature verified, event type:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event types you care about
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('🛒 Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get the email you used for registration
        const email = session.customer_details?.email || session.metadata?.email;
        
        console.log('📧 Checkout session data:', {
          email,
          customerId,
          subscriptionId,
          customer_details: session.customer_details,
          metadata: session.metadata
        });

        if (email && customerId && subscriptionId) {
          console.log('🔍 Searching for user with email:', email);
          // Find user in Firestore and update with Stripe info
          const userRef = admin.firestore().collection('users').where('email', '==', email).limit(1);
          const snapshot = await userRef.get();
          
          if (!snapshot.empty) {
            console.log('✅ Found existing user, updating with Stripe info');
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: 'active',
              trialExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000), // If you want to set a trial, adjust as needed
            });
            console.log(`✅ Updated user ${email} with Stripe subscription info`);
          } else {
            console.warn(`⚠️ No user found for email ${email}, creating new user document`);
            // CREATE a new user document if none exists
            await admin.firestore().collection('users').add({
              email: email,
              brokerName: session.metadata?.brokerName || 'New Broker',
              company: session.metadata?.company || 'New Company', 
              phone: session.metadata?.phone || '',
              subscriptionStatus: 'active',
              subscriptionPlan: session.metadata?.plan || 'starter',
              trialExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000),
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              monthlySearchesUsed: 0,
              monthlySearchLimit: 999,
            });
            console.log(`✅ Created new user document for ${email}`);
          }
        } else {
          console.error('❌ Missing required data:', { email, customerId, subscriptionId });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('💰 Processing invoice.payment_succeeded');
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        console.log('💰 Invoice data:', {
          customerId,
          subscriptionId,
          amount: invoice.amount_paid,
          customer_email: invoice.customer_email
        });

        if (customerId && subscriptionId) {
          console.log('🔍 Updating user with Stripe customer ID:', customerId);
          // Find user by Stripe customer ID and update subscription status
          const userRef = admin.firestore().collection('users').where('stripeCustomerId', '==', customerId).limit(1);
          const snapshot = await userRef.get();
          
          if (!snapshot.empty) {
            console.log('✅ Found user by Stripe customer ID, updating subscription status');
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: 'active',
              stripeSubscriptionId: subscriptionId,
            });
            console.log(`✅ Updated subscription status to active for customer ${customerId}`);
          } else {
            console.warn(`⚠️ No user found with Stripe customer ID ${customerId}`);
          }
        }
        break;
      }

      // Add more event types here if needed (subscription updates, cancellations, etc)
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(200).json({ received: true });
}