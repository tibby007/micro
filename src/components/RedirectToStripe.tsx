import React from 'react';

const STRIPE_PAYMENT_LINKS: Record<'starter' | 'pro', string> = {
  starter: 'https://buy.stripe.com/8x2aEW86o3Jq3Ub4Us4gg04',
  pro: 'https://buy.stripe.com/cNi28q4Uc0xeaiz1Ig4gg05'
};

export default function RedirectToStripe() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>
        💳 Complete Your Account Setup
      </h1>
      <p style={{ maxWidth: '500px', marginBottom: '32px', color: '#d1d5db' }}>
        To activate your 3-day trial and unlock the deal engine, please choose a plan below.
        Your card will be charged after the trial unless you cancel.
      </p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          onClick={() => window.location.href = STRIPE_PAYMENT_LINKS.starter}
          style={{
            backgroundColor: '#22c55e',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Starter – $39/mo
        </button>
        <button
          onClick={() => window.location.href = STRIPE_PAYMENT_LINKS.pro}
          style={{
            backgroundColor: '#facc15',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Pro – $97/mo
        </button>
      </div>
    </div>
  );
}
