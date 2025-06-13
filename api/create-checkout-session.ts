// src/components/ProtectedApp.tsx

import { useState, useEffect } from 'react'; // Make sure useEffect is imported
import googlePlacesServiceInstance from '../services/GooglePlacesService'; // Corrected import name
import businessEnricher from '../services/businessEnricher';
import { auth } from '../firebase'; // Corrected path
import { useAuth } from '../contexts/AuthContext';

const ProtectedApp = () => {
  console.log("--- PROTECTED APP V4 LOADED ---"); // Or your current version for deploy check

  // Deal Calculator states
  const [deals, setDeals] = useState(20);
  const [commission, setCommission] = useState(1500);

  // Opportunity Finder states
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchIndustry, setSearchIndustry] = useState('');
  const [activeBusinessTab, setActiveBusinessTab] = useState<{ [key: string]: string }>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const { user, userProfile, showPaywall } = useAuth();

  // Handle payment success redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasPaymentParam = urlParams.get('payment') === 'success';
    const referrerFromStripe = document.referrer && document.referrer.includes('stripe.com');
    
    // Check if user just came from Stripe or has payment parameter
    if (hasPaymentParam || referrerFromStripe) {
      console.log('🎉 Payment detected! Refreshing user profile...');
      setIsProcessingPayment(true);
      
      // Remove the payment parameter from URL if it exists
      if (hasPaymentParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Wait for webhook to process, then refresh
      const refreshUser = async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Refreshing page to load updated user data...');
        window.location.reload();
      };
      
      refreshUser();
    }
  }, []);

  // Helper function to handle Stripe checkout
  const handleStripeCheckout = async (plan: 'starter' | 'pro') => {
    console.log('🔘 Checkout clicked for plan:', plan);
    
    try {
      // Call your API to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan,
          userEmail: user?.email || userProfile?.email,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        
        if (url) {
          console.log('✅ Checkout session created, redirecting to:', url);
          window.location.href = url;
          return;
        }
      }
      
      throw new Error('Failed to create checkout session');
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      console.log('🔄 Falling back to payment links...');
      
      // Fallback to direct payment links with redirect
      const checkoutUrls = {
        starter: 'https://buy.stripe.com/8x2aEW86o3Jq3Ub4Us4gg04',
        pro: 'https://buy.stripe.com/cNi28q4Uc0xeaiz1Ig4gg05'
      };
      
      console.log('🔗 Redirecting to payment link:', checkoutUrls[plan]);
      window.location.href = checkoutUrls[plan];
    }
  };

  // Handler functions for business actions (from your original code)
  const handleResearch = (business: any) => {
    const searchQuery = encodeURIComponent(`${business.name} ${business.address || business.vicinity}`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const handleCall = (business: any) => {
    const phone = business.contacts?.[0]?.phone || business.phone;
    if (phone && phone.toLowerCase() !== 'no phone available' && phone.toLowerCase() !== 'n/a') {
      window.open(`tel:${phone}`, '_self');
    } else {
      alert('No phone number available for this business');
    }
  };

  const handleEmail = (business: any) => {
    const contactName = business.contacts?.[0]?.name || business.name;
    const contactTitle = business.contacts?.[0]?.title || '';
    const email = business.contacts?.[0]?.email;
    const subject = encodeURIComponent('Equipment Financing Solutions for ' + business.name);
    const body = encodeURIComponent(
      `Hello ${contactName}${contactTitle ? ' (' + contactTitle + ')' : ''},\n\n` +
      `I noticed ${business.name} might benefit from equipment financing solutions. ` +
      `We specialize in micro-ticket financing ($2.5K-$45K) with fast approvals for businesses like yours.\n\n` +
      `Would you have 15 minutes this week to discuss how we can help upgrade your equipment?\n\n` +
      `Best regards`
    );
    if (email && email.toLowerCase() !== 'n/a') {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
    } else {
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    }
  };

  const exportToCSV = () => {
    if (searchResults.length === 0) return;
    const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Employee Count', 'Industry', 'Micro Ticket Score', 'Contact Name', 'Contact Title', 'Contact Email', 'Contact Phone'];
    const rows = searchResults.map((business: any) => {
      const primaryContact = business.contacts?.[0] || {};
      return [
        business.name || 'N/A',
        business.address || business.vicinity || 'N/A',
        business.phone || primaryContact.phone || 'N/A',
        business.website || business.domain || 'N/A',
        business.rating || 'N/A',
        business.employeeCount || 'N/A',
        business.industry || 'N/A',
        business.microTicketScore || 0,
        primaryContact.name || 'N/A',
        primaryContact.title || 'N/A',
        primaryContact.email || 'N/A',
        primaryContact.phone || 'N/A'
      ].map(String);
    });
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${searchCity}_${searchIndustry}_enriched_businesses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = async () => {
    if (!city || !industry) {
      setSearchError('Please enter both city and industry');
      return;
    }
    setIsLoading(true);
    setSearchError('');
    setSearchResults([]);
    setSearchCity(city);
    setSearchIndustry(industry);
    try {
      console.log('ProtectedApp: Starting Google Places search for:', industry, 'in', city);
      // Ensure you are using REAL Google Data for this test
      const googleResults = await googlePlacesServiceInstance.searchBusinesses(city, industry); 
      console.log('ProtectedApp: DETAILED Google Places results (REAL DATA):', JSON.stringify(googleResults, null, 2));
      
      if (googleResults && googleResults.length > 0) {
        console.log('ProtectedApp: Enriching Google results...');
        const enrichedResults = await businessEnricher.enrichProspects(googleResults);
        console.log('ProtectedApp: Enriched results:', enrichedResults);
        setSearchResults(enrichedResults);
      } else {
        console.log('ProtectedApp: No results from Google Places.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('ProtectedApp: Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setSearchError(`Failed to search businesses. ${errorMessage} Please try again.`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyIncome = deals * commission;
  const yearlyIncome = monthlyIncome * 12;

  const getBusinessKey = (business: any, index: number) => {
    return business.place_id || business.id || `business-${index}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 text-left">
              <h1 className="text-4xl font-bold text-yellow-400 mb-2">Your Deal Engine Dashboard</h1>
              <p className="text-xl text-gray-300">Find, Calculate, and Close More Micro Ticket Deals</p>
            </div>
            <button
              onClick={() => {
                auth.signOut();
                window.location.href = '/'; 
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>
          
          {userProfile && ( 
            <div className="text-gray-400 text-left">
                <p>Welcome, {userProfile.brokerName || user?.displayName || 'Broker'} from {userProfile.company || 'Your Company'}</p>
                {!showPaywall && userProfile.subscriptionStatus === 'trial' && (
                    <p className="text-sm text-yellow-400">🎯 3-Day Free Trial Active</p>
                )}
                {showPaywall && userProfile.subscriptionStatus === 'trial' && (
                     <p className="text-sm text-red-400">🚨 Your 3-Day Trial Has Expired!</p>
                )}
            </div>
          )}
        </div>

        {/* Payment Processing Banner */}
        {isProcessingPayment && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">
            <h3 className="font-bold text-lg mb-1">🎉 Payment Successful!</h3>
            <p className="text-sm mb-3">
              Setting up your account... You'll have search access in just a moment.
            </p>
            <div className="flex justify-center items-center gap-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white text-green-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {/* TRIAL EXPIRY / UPGRADE BANNER */}
        {showPaywall && userProfile?.subscriptionStatus === 'trial' && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 text-center">
            <h3 className="font-bold text-lg mb-1">
              {userProfile.stripeCustomerId ? 'Your Free Trial Has Expired!' : 'Begin Your 3-Day Free Trial!'}
            </h3>
            <p className="text-sm mb-3">
              {userProfile.stripeCustomerId 
                ? 'Please upgrade to continue finding amazing micro ticket deals.'
                : 'Choose your plan below to start your trial and access deal search.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => handleStripeCheckout('starter')}
                className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors"
              > Get Starter </button>
              <button 
                onClick={() => handleStripeCheckout('pro')}
                className="bg-black text-yellow-400 px-6 py-2 rounded font-bold hover:bg-gray-900 transition-colors"
              > Go Pro </button>
            </div>
          </div>
        )}
        
        {/* Original Upgrade Banner - Show if NOT expired AND still on trial */}
        {!showPaywall && userProfile?.subscriptionStatus === 'trial' && (
            <div className="bg-yellow-500 text-black p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg mb-1">🎯 Trial Account - Upgrade to Unlock Full Access!</h3>
                    <p className="text-sm">
                    Choose your plan: <strong>Starter ($39/mo)</strong> for 25 searches or <strong>Pro ($97/mo)</strong> for unlimited searches
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                    onClick={() => handleStripeCheckout('starter')}
                    className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors"
                    > Get Starter </button>
                    <button 
                    onClick={() => handleStripeCheckout('pro')}
                    className="bg-black text-yellow-400 px-6 py-2 rounded font-bold hover:bg-gray-900 transition-colors"
                    > Go Pro </button>
                </div>
            </div>
        )}
        
        {/* Deal Calculator */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-2">📊</span> Deal Calculator & ROI Planner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Monthly Micro Deals Target</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">5 deals</span><span className="text-white font-bold">{deals} deals</span><span className="text-gray-400">100 deals</span>
                </div>
                <input type="range" min="5" max="100" value={deals} onChange={(e) => setDeals(Number(e.target.value))} className="w-full slider"/>
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Average Commission per Deal</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">$700</span><span className="text-white font-bold">${commission.toLocaleString()}</span><span className="text-gray-400">$2450</span>
                </div>
                <input type="range" min="700" max="2450" step="50" value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="w-full slider"/>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Your Potential Income</h3>
              <div className="space-y-3">
                <div><p className="text-gray-400">Monthly:</p><p className="text-3xl font-bold text-green-400">${monthlyIncome.toLocaleString()}</p></div>
                <div><p className="text-gray-400">Yearly:</p><p className="text-3xl font-bold text-green-400">${yearlyIncome.toLocaleString()}</p></div>
              </div>
              <div className="mt-4 p-3 bg-blue-600 rounded"><p className="text-sm text-white"><strong>Pro Tip:</strong> Most brokers chase 2-3 big deals. You'll close {deals} micro deals with less stress and more predictable income.</p></div>
            </div>
          </div>
        </div>

        {/* Opportunity Finder */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center"> <span className="mr-2">🔍</span> Opportunity Finder </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-300 mb-2">Your City/Market</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Atlanta, Miami, Dallas" className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Target Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Select an industry</option>
                <option value="Restaurants & Food Service">Restaurants & Food Service</option>
                <option value="Retail & E-commerce">Retail & E-commerce</option>
                <option value="Medical & Healthcare">Medical & Healthcare</option>
                <option value="Auto Repair & Service">Auto Repair & Service</option>
                <option value="Salons & Spas">Salons & Spas</option>
                <option value="Gyms & Fitness">Gyms & Fitness</option>
                <option value="Hotels & Hospitality">Hotels & Hospitality</option>
                <option value="Construction & Contractors">Construction & Contractors</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={showPaywall || isLoading || !city || !industry}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? (<span className="flex items-center justify-center"><span className="animate-spin mr-2">⚪</span> Finding & Enriching Opportunities...</span>) : ('Search for Opportunities')}
          </button>

          {showPaywall && userProfile && (
            <div className="mt-6 text-center text-yellow-400 p-4 bg-gray-700 rounded-lg">
                <p>Please upgrade your plan to search for opportunities.</p>
            </div>
          )}
          {!showPaywall && searchError && (<div className="mt-4 p-3 bg-red-600 rounded-lg"><p className="text-white">{searchError}</p></div>)}
          {!showPaywall && searchResults.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white"> Found {searchResults.length} businesses in {searchCity} - {searchIndustry}</h3>
                <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"><span>📊</span> Export to CSV</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((business: any, index) => {
                  const businessKey = getBusinessKey(business, index);
                  const equipmentSuggestions = business.industry 
                    ? businessEnricher.getEquipmentSuggestions(business.industry)
                    : businessEnricher.getEquipmentSuggestions(searchIndustry);
                  return (
                  <div key={businessKey} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white flex-1">{business.name || 'Unknown Business'}</h4>
                      {business.microTicketScore > 0 && (<span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Score: {business.microTicketScore}</span>)}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{business.address || business.vicinity || 'Address not available'}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-300 mb-3">
                      {business.phone && <span>📞 {business.phone}</span>}
                      {business.rating !== undefined && business.rating > 0 && <span>⭐ {business.rating}</span>}
                      {business.employeeCount > 0 && <span>👥 {business.employeeCount} employees</span>}
                      {business.industry && <span>🏢 {business.industry}</span>}
                    </div>
                    {business.contacts && business.contacts.length > 0 && (
                      <div className="bg-gray-800 rounded p-2 mb-3">
                        <p className="text-xs font-semibold text-blue-400 mb-1">📧 Decision Makers Found:</p>
                        {business.contacts.slice(0, 2).map((contact: any, idx: number) => (
                          <div key={`${businessKey}-contact-${idx}`} className="text-xs text-gray-300">
                            • {contact.name || 'N/A'} - {contact.title || 'N/A'}
                            {contact.email && contact.email.toLowerCase() !== 'n/a' && <span className="text-green-400 ml-1">✓ Email</span>}
                            {contact.phone && contact.phone.toLowerCase() !== 'n/a' && <span className="text-green-400 ml-1">✓ Phone</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-gray-800 rounded p-2 mb-3">
                      <p className="text-xs font-semibold text-yellow-400 mb-1">💡 Potential Equipment Needs:</p>
                      <ul className="text-xs text-gray-300">
                        {Array.isArray(equipmentSuggestions) && equipmentSuggestions.slice(0, 3).map((equipment, eqIdx) => (
                          <li key={`${businessKey}-eq-${eqIdx}`}>• {equipment}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {['research', 'call', 'email'].map(tabName => (
                        <button
                          key={tabName}
                          onClick={() => setActiveBusinessTab(prev => ({ ...prev, [businessKey]: tabName }))}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            (activeBusinessTab[businessKey] === tabName || (!activeBusinessTab[businessKey] && tabName === 'research'))
                              ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        > {tabName.charAt(0).toUpperCase() + tabName.slice(1)} </button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-300">
                      {(!activeBusinessTab[businessKey] || activeBusinessTab[businessKey] === 'research') && (<div><button onClick={() => handleResearch(business)} className="w-full text-left hover:text-blue-400 mb-1 transition-colors">📌 Research this business online →</button><p className="mb-1">💡 Check their current equipment</p><p>🔍 Look for expansion plans</p></div>)}
                      {activeBusinessTab[businessKey] === 'call' && (<div><button onClick={() => handleCall(business)} className="w-full text-left hover:text-green-400 mb-1 transition-colors">📞 Call: {business.contacts?.[0]?.phone || business.phone || 'No phone available'} →</button><p className="mb-1">🎯 Ask about equipment needs</p><p>💰 Mention financing options</p></div>)}
                      {activeBusinessTab[businessKey] === 'email' && (<div><button onClick={() => handleEmail(business)} className="w-full text-left hover:text-purple-400 mb-1 transition-colors">✉️ {business.contacts?.[0]?.email && business.contacts[0].email.toLowerCase() !== 'n/a' ? `Email ${business.contacts[0].name}` : 'Send intro email'} →</button><p className="mb-1">📊 Include case studies</p><p>🤝 Offer free consultation</p></div>)}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Micro Ticket Equipment by Industry Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center"><span className="mr-2">🎯</span> Micro Ticket Equipment by Industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-700 rounded-lg p-4"><h3 className="text-lg font-bold text-white mb-3 flex items-center"><span className="mr-2">💰</span> Why Micro Tickets Win</h3><div className="text-sm text-gray-300 space-y-2"><p>Deal Size: <span className="text-green-400">$2.5K - $45K</span></p><p>Commission: <span className="text-yellow-400">4% - 7%</span></p><p>Close Rate: <span className="text-blue-400">25% - 40%</span></p><p>Speed: <span className="text-green-400">7-14 days</span></p><p className="text-xs mt-2">Higher volume, faster closes, less competition than big ticket deals</p></div></div>
            <div className="bg-gray-700 rounded-lg p-4"><h3 className="text-lg font-bold text-white mb-3 flex items-center"><span className="mr-2">📊</span> Micro Ticket ROI</h3><div className="text-sm text-gray-300 space-y-2"><p>Avg Commission: <span className="text-green-400">$750 - $3,150</span></p><p>Monthly Volume: <span className="text-yellow-400">8-15 deals</span></p><p>Time Investment: <span className="text-blue-400">2-3 hrs/deal</span></p><p>Success Rate: <span className="text-green-400">Much Higher</span></p><p className="text-xs mt-2">Perfect for scaling to 6-figure income through consistent volume</p></div></div>
            <div className="bg-gray-700 rounded-lg p-4"><h3 className="text-lg font-bold text-white mb-3 flex items-center"><span className="mr-2">🎯</span> 6-Figure Math</h3><div className="text-sm text-gray-300 space-y-2"><p>Target Income: <span className="text-green-400">$100,000</span></p><p>Avg Commission: <span className="text-yellow-400">$1,500</span></p><p>Deals Needed: <span className="text-blue-400">67 deals/year</span></p><p>Monthly Goal: <span className="text-green-400">6 deals/month</span></p><p className="text-xs mt-2">Much more achievable than chasing big ticket deals!</p></div></div>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><span className="mr-2">🛒</span> Micro Ticket Equipment Categories by Industry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4"><h4 className="font-bold text-blue-400 mb-2">Restaurants ($5K-$35K)</h4><ul className="text-sm text-gray-300 space-y-1"><li>• POS Systems ($3K-$12K)</li><li>• Commercial Ovens ($8K-$25K)</li><li>• Refrigeration Units ($4K-$15K)</li><li>• Food Prep Equipment ($2K-$8K)</li><li>• Espresso Machines ($5K-$20K)</li></ul></div>
              <div className="bg-gray-700 rounded-lg p-4"><h4 className="font-bold text-green-400 mb-2">Retail Stores ($3K-$25K)</h4><ul className="text-sm text-gray-300 space-y-1"><li>• POS & Payment Systems ($2K-$8K)</li><li>• Security Cameras ($3K-$12K)</li><li>• Display Fixtures ($4K-$15K)</li><li>• Inventory Scanners ($2K-$6K)</li><li>• Digital Signage ($5K-$18K)</li></ul></div>
              <div className="bg-gray-700 rounded-lg p-4"><h4 className="font-bold text-yellow-400 mb-2">Medical Offices ($8K-$45K)</h4><ul className="text-sm text-gray-300 space-y-1"><li>• Digital X-Ray ($15K-$45K)</li><li>• Patient Monitors ($8K-$25K)</li><li>• Ultrasound Equipment ($12K-$35K)</li><li>• EMR Software/Hardware ($5K-$15K)</li><li>• Dental Chairs ($10K-$30K)</li></ul></div>
              <div className="bg-gray-700 rounded-lg p-4"><h4 className="font-bold text-purple-400 mb-2">Auto Repair ($5K-$40K)</h4><ul className="text-sm text-gray-300 space-y-1"><li>• Diagnostic Equipment ($8K-$25K)</li><li>• Lifts & Hoists ($10K-$35K)</li><li>• Air Compressors ($3K-$12K)</li><li>• Tire Changers ($5K-$15K)</li><li>• Paint Booths ($15K-$40K)</li></ul></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedApp;