// Add these cases to your switch statement in stripe-webhook.ts

case 'customer.subscription.deleted': {
  console.log('🚫 Processing customer.subscription.deleted');
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;

  console.log('🚫 Subscription deleted:', {
    customerId,
    subscriptionId,
    status: subscription.status
  });

  if (customerId) {
    console.log('🔍 Finding user with Stripe customer ID:', customerId);
    const userRef = admin.firestore().collection('users').where('stripeCustomerId', '==', customerId).limit(1);
    const snapshot = await userRef.get();
    
    if (!snapshot.empty) {
      console.log('✅ Found user, updating to canceled status');
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({
        subscriptionStatus: 'canceled',
        canceledAt: admin.firestore.Timestamp.now(),
      });
      console.log(`✅ Updated user subscription status to canceled for customer ${customerId}`);
    } else {
      console.warn(`⚠️ No user found with Stripe customer ID ${customerId}`);
    }
  }
  break;
}

case 'customer.subscription.updated': {
  console.log('🔄 Processing customer.subscription.updated');
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status; // active, canceled, past_due, etc.

  console.log('🔄 Subscription updated:', {
    customerId,
    subscriptionId,
    status,
    cancel_at_period_end: subscription.cancel_at_period_end
  });

  if (customerId) {
    console.log('🔍 Finding user with Stripe customer ID:', customerId);
    const userRef = admin.firestore().collection('users').where('stripeCustomerId', '==', customerId).limit(1);
    const snapshot = await userRef.get();
    
    if (!snapshot.empty) {
      console.log('✅ Found user, updating subscription status');
      const userDoc = snapshot.docs[0];
      
      // Map Stripe status to our internal status
      let internalStatus = 'active';
      if (status === 'canceled' || status === 'incomplete_expired') {
        internalStatus = 'canceled';
      } else if (status === 'past_due' || status === 'unpaid') {
        internalStatus = 'past_due';
      } else if (status === 'active' || status === 'trialing') {
        internalStatus = 'active';
      }

      const updateData: any = {
        subscriptionStatus: internalStatus,
        stripeSubscriptionId: subscriptionId,
      };

      // If subscription is canceled, add timestamp
      if (internalStatus === 'canceled') {
        updateData.canceledAt = admin.firestore.Timestamp.now();
      }

      await userDoc.ref.update(updateData);
      console.log(`✅ Updated user subscription status to ${internalStatus} for customer ${customerId}`);
    } else {
      console.warn(`⚠️ No user found with Stripe customer ID ${customerId}`);
    }
  }
  break;
}

case 'invoice.payment_failed': {
  console.log('💳 Processing invoice.payment_failed');
  const invoice = event.data.object as any;
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const attemptCount = invoice.attempt_count;

  console.log('💳 Payment failed:', {
    customerId,
    subscriptionId,
    attemptCount,
    amount: invoice.amount_due
  });

  if (customerId) {
    console.log('🔍 Finding user with Stripe customer ID:', customerId);
    const userRef = admin.firestore().collection('users').where('stripeCustomerId', '==', customerId).limit(1);
    const snapshot = await userRef.get();
    
    if (!snapshot.empty) {
      console.log('✅ Found user, updating to past_due status');
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({
        subscriptionStatus: 'past_due',
        lastPaymentFailedAt: admin.firestore.Timestamp.now(),
        paymentAttempts: attemptCount,
      });
      console.log(`✅ Updated user to past_due status for customer ${customerId}`);
    } else {
      console.warn(`⚠️ No user found with Stripe customer ID ${customerId}`);
    }
  }
  break;
}