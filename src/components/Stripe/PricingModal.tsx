// src/components/Stripe/PricingModal.tsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');

  if (!isOpen) return null;

  const handleUpgrade = async (planType: 'basic' | 'pro') => {
    setLoading(true);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('https://micro-ticket-stripe-server-f9bd01ca3509.herokuapp.com/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          userEmail: userProfile?.email,
          userId: userProfile?.uid
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error starting checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              🚀 Choose Your Plan
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg text-gray-600">
              Scale your brokerage with unlimited prospect searches and premium tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Basic Plan */}
            <div className={`border-2 rounded-lg p-6 ${selectedPlan === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Basic Plan
                </h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  $39<span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Perfect for getting started</p>
                <button
                  onClick={() => setSelectedPlan('basic')}
                  className={`w-full py-2 px-4 rounded-lg mb-4 ${
                    selectedPlan === 'basic' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Select Basic
                </button>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="font-bold">25 prospect searches/month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Email templates & copy functionality
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  CSV export functionality
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Deal calculator & ROI tools
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Save prospects to your list
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Industry ROI analysis
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Standard email support
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className={`border-2 rounded-lg p-6 relative ${selectedPlan === 'pro' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Pro Plan
                </h3>
                <div className="text-4xl font-bold text-green-600 mb-4">
                  $97<span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">For serious brokers scaling their business</p>
                <button
                  onClick={() => setSelectedPlan('pro')}
                  className={`w-full py-2 px-4 rounded-lg mb-4 ${
                    selectedPlan === 'pro' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Select Pro
                </button>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="font-bold">Unlimited prospect searches</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Everything in Basic plan
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Advanced email templates
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Priority support & faster response
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Phone & chat support
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Advanced analytics & reporting
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  API access (coming soon)
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => handleUpgrade(selectedPlan)}
              disabled={loading}
              className={`px-8 py-4 text-lg font-bold rounded-lg ${
                selectedPlan === 'basic' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {loading ? '🔄 Processing...' : `Upgrade to ${selectedPlan === 'basic' ? 'Basic' : 'Pro'} Plan`}
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              💳 Secure payment powered by Stripe • Cancel anytime • 30-day money-back guarantee
            </p>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">🎯 Why Upgrade Now?</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-gray-800">💰 Quick ROI</h5>
                <p className="text-gray-600">
                  {selectedPlan === 'basic' 
                    ? 'One $15K deal pays for 11+ months of Basic plan' 
                    : 'One $30K deal pays for 9+ months of Pro plan'}
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">⏰ Time Savings</h5>
                <p className="text-gray-600">Find qualified prospects 10x faster than manual research</p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">📈 Scale Your Business</h5>
                <p className="text-gray-600">
                  {selectedPlan === 'basic' 
                    ? '25 searches = up to 125 qualified prospects/month' 
                    : 'Unlimited searches = unlimited income potential'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 All plans include secure data handling, GDPR compliance, and can be cancelled anytime.
              <br />
              Your subscription will be processed securely through Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}