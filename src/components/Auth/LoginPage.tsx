import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'starter' | 'pro'>('starter');
  const [loading, setLoading] = useState(false);
  const { sendLoginLink, message, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      
      if (isRegister) {
        const brokerInfo = {
          brokerName: brokerName || 'Broker',
          company: company || 'Your Company',
          phone: phone || '',
          plan: plan || 'starter'
        };
        await sendLoginLink(email, brokerInfo);
      } else {
        await sendLoginLink(email);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (message && message.includes('Check your email')) {
    return (
      <div style={{ 
        minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '16px' }}>📧 Check Your Email!</h2>
            <p style={{ color: '#4b5563', marginBottom: '24px' }}>{message}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontSize: '16px',
                cursor: 'pointer', width: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Send Another Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '450px', width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            🎯 Micro Ticket Deal Engine
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            {isRegister ? 'Start your micro ticket financing journey' : 'Sign in to find your next deals'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>

          {isRegister && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  placeholder="John Smith"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your Brokerage"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                  Choose Your Plan
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as 'starter' | 'pro')}
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                >
                  <option value="starter">Starter – $39/mo</option>
                  <option value="pro">Pro – $97/mo</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 20px',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: 'white', border: 'none', borderRadius: '6px',
              fontSize: '16px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '📧 Sending...' : isRegister ? '📧 Send Registration Link' : '📧 Send Login Link'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Already have an account? Sign in' : 'Need an account? Sign up here'}
          </button>
        </div>

        {/* Pricing Cards */}
        {/* Leave this section unchanged since it's display-only */}
      </div>
    </div>
  );
}
