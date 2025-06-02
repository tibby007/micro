import { useState } from 'react';
import GooglePlacesService from '../services/GooglePlacesService';
import businessEnricher from '../services/businessEnricher';
import { auth } from "../firebase";
import { useAuth } from '../contexts/AuthContext';

const ProtectedApp = () => {
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
  
  // Get user info
  const { user } = useAuth();
  
  // Handler functions for business actions
  const handleResearch = (business: any) => {
    const searchQuery = encodeURIComponent(`${business.name} ${business.address}`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const handleCall = (business: any) => {
    // Try to use contact phone first, then business phone
    const phone = business.contacts?.[0]?.phone || business.phone;
    
    if (phone && phone !== 'No phone available') {
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
    
    if (email) {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
    } else {
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    }
  };

  

  // CSV Export function
  const exportToCSV = () => {
    if (searchResults.length === 0) return;
    
    // Create CSV headers
    const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Employee Count', 'Industry', 'Micro Ticket Score', 'Contact Name', 'Contact Title', 'Contact Email', 'Contact Phone'];
    
    // Create CSV rows
    const rows = searchResults.map((business: any) => {
      const primaryContact = business.contacts?.[0] || {};
      return [
        business.name,
        business.address || business.vicinity || 'N/A',
        business.phone || 'N/A',
        business.website || business.domain || 'N/A',
        business.rating || 'N/A',
        business.employeeCount || 'N/A',
        business.industry || 'N/A',
        business.microTicketScore || 0,
        primaryContact.name || 'N/A',
        primaryContact.title || 'N/A',
        primaryContact.email || 'N/A',
        primaryContact.phone || 'N/A'
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${searchCity}_${searchIndustry}_enriched_businesses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Search function
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
      console.log('Starting search for:', industry, 'in', city);
      // Get Google Places results
      const googleResults = await GooglePlacesService.searchBusinesses(city, industry);
      console.log('Google results:', googleResults);
      
      // Enrich with Apollo data
      const enricher = businessEnricher;
      const enrichedResults = await enricher.enrichProspects(googleResults, searchIndustry);
      console.log('Enriched results:', enrichedResults);
      
      setSearchResults(enrichedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search businesses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyIncome = deals * commission;
  const yearlyIncome = monthlyIncome * 12;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-yellow-400 mb-2">Your Deal Engine Dashboard</h1>
              <p className="text-xl text-gray-300">Find, Calculate, and Close More Micro Ticket Deals</p>
            </div>
            <button
              onClick={() => {
                auth.signOut();
                window.location.href = '/';
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Logout
            </button>
          </div>
          
          {/* User Info */}
          {user && (
            <div className="text-gray-400">
          <p>Welcome, {user.email || 'Broker'}</p>
              <p className="text-sm text-yellow-400">🎯 3-Day Free Trial Active</p>
            </div>
          )}
        </div>

        {/* Upgrade Banner - Add this after the header, before Deal Calculator */}
        <div className="bg-yellow-500 text-black p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">🎯 Trial Account - Upgrade to Unlock Full Access!</h3>
            <p className="text-sm">
              Choose your plan: <strong>Starter ($39/mo)</strong> for 25 searches or <strong>Pro ($97/mo)</strong> for unlimited searches
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.href = 'https://buy.stripe.com/8x2aEW86o3Jq3Ub4Us4gg04'}
              className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors"
            >
              Get Starter
            </button>
            <button 
              onClick={() => window.location.href = 'https://buy.stripe.com/cNi28q4Uc0xeaiz1Ig4gg05'}
              className="bg-black text-yellow-400 px-6 py-2 rounded font-bold hover:bg-gray-900 transition-colors"
            >
              Go Pro
            </button>
          </div>
        </div>
        
        {/* Deal Calculator */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-2">📊</span> Deal Calculator & ROI Planner
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Monthly Micro Deals Target</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">5 deals</span>
                  <span className="text-white font-bold">{deals} deals</span>
                  <span className="text-gray-400">100 deals</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={deals}
                  onChange={(e) => setDeals(Number(e.target.value))}
                  className="w-full slider"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Average Commission per Deal</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">$700</span>
                  <span className="text-white font-bold">${commission.toLocaleString()}</span>
                  <span className="text-gray-400">$2450</span>
                </div>
                <input
                  type="range"
                  min="700"
                  max="2450"
                  step="50"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full slider"
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Your Potential Income</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400">Monthly:</p>
                  <p className="text-3xl font-bold text-green-400">${monthlyIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Yearly:</p>
                  <p className="text-3xl font-bold text-green-400">${yearlyIncome.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-600 rounded">
                <p className="text-sm text-white">
                  <strong>Pro Tip:</strong> Most brokers chase 2-3 big deals. You'll close {deals} micro deals with less stress and more predictable income.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Finder */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-2">🔍</span> Opportunity Finder
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-300 mb-2">Your City/Market</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Atlanta, Miami, Dallas"
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Target Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
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
            disabled={isLoading || !city || !industry}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⚪</span> Finding & Enriching Opportunities...
              </span>
            ) : (
              'Search for Opportunities'
            )}
          </button>

          {searchError && (
            <div className="mt-4 p-3 bg-red-600 rounded-lg">
              <p className="text-white">{searchError}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Found {searchResults.length} businesses in {searchCity} - {searchIndustry}
                </h3>
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span>📊</span> Export to CSV
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((business: any, index) => {
                  // Get equipment recommendations from enricher
                  const equipmentSuggestions = business.industry 
                    ? businessEnricher.getEquipmentSuggestions(business.industry)
                    : businessEnricher.getEquipmentSuggestions(searchIndustry);
                  return (
                  <div key={business.id || index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white flex-1">{business.name}</h4>
                      {business.microTicketScore > 0 && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Score: {business.microTicketScore}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{business.address || business.vicinity}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-300 mb-3">
                      {business.phone && <span>📞 {business.phone}</span>}
                      {business.rating && <span>⭐ {business.rating}</span>}
                      {business.employeeCount > 0 && <span>👥 {business.employeeCount} employees</span>}
                      {business.industry && <span>🏢 {business.industry}</span>}
                    </div>
                    
                    {/* Contacts if available */}
                    {business.contacts && business.contacts.length > 0 && (
                      <div className="bg-gray-800 rounded p-2 mb-3">
                        <p className="text-xs font-semibold text-blue-400 mb-1">📧 Decision Makers Found:</p>
                        {business.contacts.slice(0, 2).map((contact: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-300">
                            • {contact.name} - {contact.title}
                            {contact.email && <span className="text-green-400 ml-1">✓ Email</span>}
                            {contact.phone && <span className="text-green-400 ml-1">✓ Phone</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Equipment Recommendations */}
                    <div className="bg-gray-800 rounded p-2 mb-3">
                      <p className="text-xs font-semibold text-yellow-400 mb-1">💡 Potential Equipment Needs:</p>
                      <ul className="text-xs text-gray-300">
                      {equipmentSuggestions.slice(0, 3).map((equipment: any, idx: number) => (
                          <li key={idx}>• {equipment}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setActiveBusinessTab({ ...activeBusinessTab, [business.id]: 'research' })}
                        className={`px-3 py-1 rounded text-sm ${
                          (!activeBusinessTab[business.id] || activeBusinessTab[business.id] === 'research')
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        Research
                      </button>
                      <button
                        onClick={() => setActiveBusinessTab({ ...activeBusinessTab, [business.id]: 'call' })}
                        className={`px-3 py-1 rounded text-sm ${
                          activeBusinessTab[business.id] === 'call'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        Call
                      </button>
                      <button
                        onClick={() => setActiveBusinessTab({ ...activeBusinessTab, [business.id]: 'email' })}
                        className={`px-3 py-1 rounded text-sm ${
                          activeBusinessTab[business.id] === 'email'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        Email
                      </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="text-sm text-gray-300">
                      {(!activeBusinessTab[business.id] || activeBusinessTab[business.id] === 'research') && (
                        <div>
                          <button 
                            onClick={() => handleResearch(business)}
                            className="w-full text-left hover:text-blue-400 mb-1 transition-colors"
                          >
                            📌 Research this business online →
                          </button>
                          <p className="mb-1">💡 Check their current equipment</p>
                          <p>🔍 Look for expansion plans</p>
                        </div>
                      )}
                      {activeBusinessTab[business.id] === 'call' && (
                        <div>
                          <button 
                            onClick={() => handleCall(business)}
                            className="w-full text-left hover:text-green-400 mb-1 transition-colors"
                          >
                            📞 Call: {business.contacts?.[0]?.phone || business.phone || 'No phone available'} →
                          </button>
                          <p className="mb-1">🎯 Ask about equipment needs</p>
                          <p>💰 Mention financing options</p>
                        </div>
                      )}
                      {activeBusinessTab[business.id] === 'email' && (
                        <div>
                          <button 
                            onClick={() => handleEmail(business)}
                            className="w-full text-left hover:text-purple-400 mb-1 transition-colors"
                          >
                            ✉️ {business.contacts?.[0]?.email ? `Email ${business.contacts[0].name}` : 'Send intro email'} →
                          </button>
                          <p className="mb-1">📊 Include case studies</p>
                          <p>🤝 Offer free consultation</p>
                        </div>
                      )}
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
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-2">🎯</span> Micro Ticket Equipment by Industry
          </h2>
          
          {/* Three info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Why Micro Tickets Win */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <span className="mr-2">💰</span> Why Micro Tickets Win
              </h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>Deal Size: <span className="text-green-400">$2.5K - $45K</span></p>
                <p>Commission: <span className="text-yellow-400">4% - 7%</span></p>
                <p>Close Rate: <span className="text-blue-400">25% - 40%</span></p>
                <p>Speed: <span className="text-green-400">7-14 days</span></p>
                <p className="text-xs mt-2">Higher volume, faster closes, less competition than big ticket deals</p>
              </div>
            </div>
            
            {/* Micro Ticket ROI */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <span className="mr-2">📊</span> Micro Ticket ROI
              </h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>Avg Commission: <span className="text-green-400">$750 - $3,150</span></p>
                <p>Monthly Volume: <span className="text-yellow-400">8-15 deals</span></p>
                <p>Time Investment: <span className="text-blue-400">2-3 hrs/deal</span></p>
                <p>Success Rate: <span className="text-green-400">Much Higher</span></p>
                <p className="text-xs mt-2">Perfect for scaling to 6-figure income through consistent volume</p>
              </div>
            </div>
            
            {/* 6-Figure Math */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <span className="mr-2">🎯</span> 6-Figure Math
              </h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>Target Income: <span className="text-green-400">$100,000</span></p>
                <p>Avg Commission: <span className="text-yellow-400">$1,500</span></p>
                <p>Deals Needed: <span className="text-blue-400">67 deals/year</span></p>
                <p>Monthly Goal: <span className="text-green-400">6 deals/month</span></p>
                <p className="text-xs mt-2">Much more achievable than chasing big ticket deals!</p>
              </div>
            </div>
          </div>
          
          {/* Equipment Categories */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🛒</span> Micro Ticket Equipment Categories by Industry
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Restaurants */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-bold text-blue-400 mb-2">Restaurants ($5K-$35K)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• POS Systems ($3K-$12K)</li>
                  <li>• Commercial Ovens ($8K-$25K)</li>
                  <li>• Refrigeration Units ($4K-$15K)</li>
                  <li>• Food Prep Equipment ($2K-$8K)</li>
                  <li>• Espresso Machines ($5K-$20K)</li>
                </ul>
              </div>
              
              {/* Retail Stores */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-bold text-green-400 mb-2">Retail Stores ($3K-$25K)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• POS & Payment Systems ($2K-$8K)</li>
                  <li>• Security Cameras ($3K-$12K)</li>
                  <li>• Display Fixtures ($4K-$15K)</li>
                  <li>• Inventory Scanners ($2K-$6K)</li>
                  <li>• Digital Signage ($5K-$18K)</li>
                </ul>
              </div>
              
              {/* Medical Offices */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-bold text-yellow-400 mb-2">Medical Offices ($8K-$45K)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Digital X-Ray ($15K-$45K)</li>
                  <li>• Patient Monitors ($8K-$25K)</li>
                  <li>• Ultrasound Equipment ($12K-$35K)</li>
                  <li>• EMR Software/Hardware ($5K-$15K)</li>
                  <li>• Dental Chairs ($10K-$30K)</li>
                </ul>
              </div>
              
              {/* Auto Repair */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-bold text-purple-400 mb-2">Auto Repair ($5K-$40K)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Diagnostic Equipment ($8K-$25K)</li>
                  <li>• Lifts & Hoists ($10K-$35K)</li>
                  <li>• Air Compressors ($3K-$12K)</li>
                  <li>• Tire Changers ($5K-$15K)</li>
                  <li>• Paint Booths ($15K-$40K)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedApp;