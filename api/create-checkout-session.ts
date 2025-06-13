// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { plan, userEmail } = req.body;

    // Define your price IDs (get these from Stripe Dashboard)
    const priceIds = {
      starter: 'price_1234567890', // Replace with your actual Starter price ID
      pro: 'price_0987654321',     // Replace with your actual Pro price ID
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[plan as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: userEmail,
      success_url: `${process.env.VERCEL_URL || 'https://micro.commcapconnect.com'}/app?payment=success`,
      cancel_url: `${process.env.VERCEL_URL || 'https://micro.commcapconnect.com'}/app`,
      metadata: {
        userEmail: userEmail,
        plan: plan,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}