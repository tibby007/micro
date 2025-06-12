import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();
router.post('/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Checkout complete:', data.id);

      const customerId = data.customer;
      const subscriptionId = data.subscription;
      const email = data.customer_email;

      if (!admin.apps.length) {
        admin.initializeApp();
      }
      const db = admin.firestore();

      const userRef = db.collection('users').where('email', '==', email);
      const snapshot = await userRef.get();

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'starter', // or 'pro' based on product lookup
        });
        console.log(`✅ Updated user profile for ${email}`);
      } else {
        console.warn(`⚠️ No user found for email ${email}`);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
