
import React, { useState, useCallback, type ChangeEvent } from 'react';
import type { Prospect } from './types';
import { INDUSTRIES, EQUIPMENT_TYPES, INDUSTRY_TO_PLACE_TYPE_MAP, SUGGESTED_EQUIPMENT_NEEDS, FALLBACK_SAMPLE_PROSPECTS } from './constants';
import { CalculatorIcon, SearchIcon, FileTextIcon, DollarSignIcon, MapPinIcon, Building2Icon, UsersIcon, CheckCircleIcon } from './components/Icons';

// IMPORTANT: Ensure REACT_APP_GOOGLE_PLACES_API_KEY is set in your environment.
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_REACT_APP_GOOGLE_PLACES_API_KEY || "AIzaSyBt-lfvLReozrb3knQKyJMkWq4T38csB74";

const App: React.FC = () => {
    const [dealCount, setDealCount] = useState<number>(20);
    const [avgCommission, setAvgCommission] = useState<number>(1500); // Updated default
    const [city, setCity] = useState<string>('');
    const [industry, setIndustry] = useState<string>('');
    const [equipmentType, setEquipmentType] = useState<string>('');
    const [dealAmount, setDealAmount] = useState<number>(10000);
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [showResults, setShowResults] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const monthlyIncome = dealCount * avgCommission;
    const yearlyIncome = monthlyIncome * 12;

    const handleProspectsError = (message: string) => {
        console.error(message);
        setApiError(message);
        setProspects(FALLBACK_SAMPLE_PROSPECTS(city, industry));
    };

    const generateProspects = useCallback(async () => {
        if (!city || !industry) return;
        if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY_HERE") {
            handleProspectsError('Google Places API key is not configured or is using a placeholder. Please set REACT_APP_GOOGLE_PLACES_API_KEY in index.html.');
            setIsLoading(false);
            setShowResults(true);
            return;
        }
        
        setIsLoading(true);
        setApiError(null);
        setProspects([]); // Clear previous prospects

        const searchType = INDUSTRY_TO_PLACE_TYPE_MAP[industry] || 'establishment';
        
        try {
            // The cors-anywhere proxy lines below should be commented out or removed
            // const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; 
            // const targetUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchType + ' in ' + city)}&key=${GOOGLE_PLACES_API_KEY}`;
            // const response = await fetch(proxyUrl + targetUrl); // Ensure this line is NOT active
            
            // This is the direct API call:
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchType + ' in ' + city)}&key=${GOOGLE_PLACES_API_KEY}`
            );
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); 
                throw new Error(`API request failed with status ${response.status}: ${errorData.error_message || response.statusText}`);
            }
            
            const data = await response.json();

            if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
                 throw new Error(`Places API Error: ${data.status} - ${data.error_message || 'Unknown API error'}`);
            }
            
            if (data.results && data.results.length > 0) {
                const realProspects: Prospect[] = data.results.slice(0, 10).map((place: any) => { 
                    const needs = SUGGESTED_EQUIPMENT_NEEDS[searchType] || ['Equipment financing'];
                    const randomNeed = needs[Math.floor(Math.random() * needs.length)];
                    
                    let priority: 'High' | 'Medium' | 'Low' = 'Medium';
                    if (place.rating && place.rating < 3.5) priority = 'High'; // Businesses with lower ratings might be more in need of upgrades
                    if (place.rating && place.rating > 4.5) priority = 'Low';  // Well-rated businesses might be less urgent
                    
                    return {
                        name: place.name || 'Unnamed Business',
                        type: industry,
                        equipment: randomNeed,
                        priority: priority,
                        address: place.formatted_address || 'Address not available',
                        rating: place.rating || 'N/A'
                    };
                });
                setProspects(realProspects);
            } else {
                 handleProspectsError(`No results found for ${searchType} in ${city}. Showing sample prospects.`);
            }
        } catch (error: any) {
            handleProspectsError(`Error fetching places: ${error.message}. Showing sample prospects.`);
        }
        
        setIsLoading(false);
        setShowResults(true);
    }, [city, industry]);

    const calculatePayment = useCallback(() => {
        const rate = 0.08; 
        const term = 36; 
        const monthlyRate = rate / 12;
        if (dealAmount <= 0) return '0.00';
        const payment = (dealAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
        return payment.toFixed(2);
    }, [dealAmount]);

    const handleDealCountChange = (e: ChangeEvent<HTMLInputElement>) => setDealCount(parseInt(e.target.value, 10));
    const handleAvgCommissionChange = (e: ChangeEvent<HTMLInputElement>) => setAvgCommission(parseInt(e.target.value, 10));
    const handleCityChange = (e: ChangeEvent<HTMLInputElement>) => setCity(e.target.value);
    const handleIndustryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setIndustry(e.target.value);
        setEquipmentType(''); 
    };
    const handleEquipmentTypeChange = (e: ChangeEvent<HTMLSelectElement>) => setEquipmentType(e.target.value);
    const handleDealAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      setDealAmount(isNaN(value) ? 0 : value);
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white font-[sans-serif]">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Micro Ticket Deal Engine
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-200 mb-8">
                        Your Complete Toolkit for 6-Figure Equipment Leasing Success
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-blue-300">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6"><CalculatorIcon /></div>
                            <span>Calculate Potential</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6"><SearchIcon /></div>
                            <span>Find Opportunities</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6"><FileTextIcon /></div>
                            <span>Structure Deals</span>
                        </div>
                    </div>
                </div>

                {/* Tool 1: Deal Calculator */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 mb-12 border border-white/20 shadow-2xl">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 text-yellow-400 mr-3"><CalculatorIcon /></div>
                        <h2 className="text-2xl md:text-3xl font-bold">Deal Calculator & ROI Planner</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="dealCountRange" className="block text-lg font-semibold mb-2">Monthly Micro Deals Target</label>
                                <input
                                    id="dealCountRange"
                                    type="range"
                                    min="5"
                                    max="100"
                                    value={dealCount}
                                    onChange={handleDealCountChange}
                                    aria-labelledby="dealCountLabel"
                                />
                                <div id="dealCountLabel" className="flex justify-between text-sm text-blue-300 mt-1">
                                    <span>5 deals</span>
                                    <span className="font-bold text-white text-lg">{dealCount} deals</span>
                                    <span>100 deals</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="avgCommissionRange" className="block text-lg font-semibold mb-2">Average Commission per Deal</label>
                                <input
                                    id="avgCommissionRange"
                                    type="range"
                                    min="700" 
                                    max="2450"
                                    value={avgCommission}
                                    onChange={handleAvgCommissionChange}
                                    aria-labelledby="avgCommissionLabel"
                                />
                                <div id="avgCommissionLabel" className="flex justify-between text-sm text-blue-300 mt-1">
                                    <span>$700</span>
                                    <span className="font-bold text-white text-lg">${avgCommission}</span>
                                    <span>$2450</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-400/30 flex flex-col justify-center">
                            <h3 className="text-2xl font-bold mb-4 text-green-300">Your Potential Income</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">Monthly:</span>
                                    <span className="text-2xl font-bold text-green-400">${monthlyIncome.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">Yearly:</span>
                                    <span className="text-3xl font-bold text-green-300">${yearlyIncome.toLocaleString()}</span>
                                </div>
                                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                                    <p className="text-sm text-yellow-200">
                                        <strong>Pro Tip:</strong> Most brokers chase 2-3 big deals. You'll close {dealCount} micro deals with less stress and more predictable income.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tool 2: Opportunity Finder */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 mb-12 border border-white/20 shadow-2xl">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 text-blue-400 mr-3"><SearchIcon /></div>
                        <h2 className="text-2xl md:text-3xl font-bold">Opportunity Finder</h2>
                    </div>
                    {apiError && (
                        <div role="alert" className="mb-4 p-3 bg-red-500/30 text-red-200 border border-red-400/50 rounded-lg">
                            <p><strong>API Alert:</strong> {apiError}</p>
                            {(!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY_HERE") && <p>Please ensure the <code>REACT_APP_GOOGLE_PLACES_API_KEY</code> in index.html is set correctly and is not a placeholder.</p>}
                        </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="cityInput" className="block text-lg font-semibold mb-2">Your City/Market</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" aria-hidden="true"><MapPinIcon /></div>
                                    <input
                                        id="cityInput"
                                        type="text"
                                        placeholder="Enter your city"
                                        value={city}
                                        onChange={handleCityChange}
                                        className="w-full pl-12 pr-4 py-3 bg-blue-800/50 border border-blue-600 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        aria-label="Your City or Market"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="industrySelect" className="block text-lg font-semibold mb-2">Target Industry</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" aria-hidden="true"><Building2Icon /></div>
                                    <select
                                        id="industrySelect"
                                        value={industry}
                                        onChange={handleIndustryChange}
                                        className="w-full pl-12 pr-10 py-3 bg-blue-800/50 border border-blue-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none"
                                        aria-label="Target Industry"
                                    >
                                        <option value="">Select an industry</option>
                                        {INDUSTRIES.map((ind) => (
                                            <option key={ind} value={ind}>{ind}</option>
                                        ))}
                                    </select>
                                     <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" aria-hidden="true">
                                        <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={generateProspects}
                                disabled={!city || !industry || isLoading}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-70 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 disabled:cursor-not-allowed"
                                aria-live="polite"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Finding Opportunities...
                                    </span>
                                ) : 'Find Local Opportunities'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {showResults && prospects.length > 0 ? (
                                <div aria-labelledby="prospectsHeading">
                                    <h3 id="prospectsHeading" className="text-xl font-semibold mb-4 flex items-center">
                                        <span className="w-6 h-6 mr-2 text-green-400" aria-hidden="true"><UsersIcon /></span>
                                        Potential Prospects in {city}
                                    </h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2"> 
                                        {prospects.map((prospect, index) => (
                                            <div key={index} className="bg-blue-800/30 rounded-lg p-4 border border-blue-600/50 hover:shadow-lg transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-lg text-blue-100">{prospect.name}</h4>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        prospect.priority === 'High' ? 'bg-red-500/30 text-red-200 border border-red-400/50' :
                                                        prospect.priority === 'Medium' ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50' :
                                                        'bg-green-500/30 text-green-200 border border-green-400/50'
                                                    }`}>
                                                        {prospect.priority} Priority
                                                    </span>
                                                </div>
                                                <p className="text-blue-300 text-sm mb-1">Industry: {prospect.type}</p>
                                                <p className="text-blue-200 text-sm mb-2">Suggested Need: {prospect.equipment}</p>
                                                {prospect.address && prospect.address !== 'Address not available' && (
                                                    <p className="text-blue-400 text-xs mb-1 flex items-center"><span className="w-4 h-4 mr-1" aria-hidden="true"><MapPinIcon/></span> {prospect.address}</p>
                                                )}
                                                {prospect.rating && prospect.rating !== 'N/A' && (
                                                    <p className="text-blue-400 text-xs">⭐ Rating: {prospect.rating}/5</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-blue-300 flex flex-col items-center justify-center h-full">
                                    <div className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true"><SearchIcon /></div>
                                    <p className="text-lg">Enter city and industry to find opportunities.</p>
                                    {isLoading && <p className="mt-2 text-blue-400" role="status">Searching...</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tool 3: Deal Builder */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 mb-12 border border-white/20 shadow-2xl">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 text-green-400 mr-3" aria-hidden="true"><FileTextIcon /></div>
                        <h2 className="text-2xl md:text-3xl font-bold">Deal Builder & Structuring Tool</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="equipmentTypeSelect" className="block text-lg font-semibold mb-2">Equipment Type</label>
                                 <div className="relative">
                                    <select
                                        id="equipmentTypeSelect"
                                        value={equipmentType}
                                        onChange={handleEquipmentTypeChange}
                                        disabled={!industry || !EQUIPMENT_TYPES[industry] || EQUIPMENT_TYPES[industry].length === 0}
                                        className="w-full px-4 pr-10 py-3 bg-blue-800/50 border border-blue-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Equipment Type"
                                    >
                                        <option value="">{industry && EQUIPMENT_TYPES[industry] && EQUIPMENT_TYPES[industry].length > 0 ? 'Select equipment type' : 'Select industry first'}</option>
                                        {industry && EQUIPMENT_TYPES[industry] && EQUIPMENT_TYPES[industry].map((eq) => (
                                            <option key={eq} value={eq}>{eq}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" aria-hidden="true">
                                        <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="dealAmountInput" className="block text-lg font-semibold mb-2">Equipment Value</label>
                                <div className="relative mb-2">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" aria-hidden="true"><DollarSignIcon /></div>
                                    <input
                                        id="dealAmountInput"
                                        type="number"
                                        value={dealAmount}
                                        onChange={handleDealAmountChange}
                                        min="2000"
                                        max="35000" 
                                        step="100"
                                        className="w-full pl-12 pr-4 py-3 bg-blue-800/50 border border-blue-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="Enter equipment value"
                                        aria-label="Equipment Value in dollars"
                                    />
                                </div>
                                <div>
                                    <input
                                        id="dealAmountRange"
                                        type="range"
                                        min="2000"
                                        max="35000"
                                        step="100"
                                        value={dealAmount}
                                        onChange={handleDealAmountChange}
                                        aria-labelledby="dealAmountRangeLabel"
                                    />
                                    <div id="dealAmountRangeLabel" className="flex justify-between text-sm text-blue-300 mt-1">
                                        <span>$2K</span>
                                        <span className="font-bold text-white text-lg">${dealAmount.toLocaleString()}</span>
                                        <span>$35K</span> 
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-400/30 flex flex-col justify-center">
                            <h3 className="text-2xl font-bold mb-4 text-purple-300">Deal Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">Equipment Value:</span>
                                    <span className="font-bold text-xl">${dealAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">Monthly Payment (est.):</span>
                                    <span className="font-bold text-xl text-green-400">${calculatePayment()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">Your Commission (est. @7%):</span> 
                                    <span className="font-bold text-xl text-yellow-400">${(dealAmount * 0.07).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                                <div className="mt-6 p-4 bg-blue-500/30 rounded-lg border border-blue-400/50">
                                    <h4 className="font-semibold mb-2 text-blue-200">Client Talking Points:</h4>
                                    <ul className="text-sm space-y-1 text-blue-300 list-disc list-inside">
                                        <li>Preserve cash flow with low monthly payments</li>
                                        <li>100% tax deductible business expense (consult CPA)</li>
                                        <li>Quick approval process (often 24-48 hours)</li>
                                        <li>Typically no large down payment required</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 rounded-3xl p-8 text-center border border-yellow-400/40 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4 text-yellow-200">Ready to Start Closing Micro Deals?</h2>
                    <p className="text-xl mb-6 text-yellow-100">
                        Join our partner program and start earning high commissions on micro ticket deals.
                    </p>
                    <a 
                        href="https://join.commcapconnect.com/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 hover:from-yellow-600 hover:via-orange-600 hover:to-red-700 text-gray-900 font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-opacity-75"
                    >
                        Join Partner Program
                    </a>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-yellow-200">
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 text-yellow-400" aria-hidden="true"><CheckCircleIcon /></div>
                            <span>Fast Approvals</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 text-yellow-400" aria-hidden="true"><CheckCircleIcon /></div>
                            <span>Competitive Rates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 text-yellow-400" aria-hidden="true"><CheckCircleIcon /></div>
                            <span>High Commissions</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center mt-12 py-6 text-blue-300 border-t border-blue-700/50">
                    <p className="text-sm md:text-base mb-1">Commercial Capital Connect</p>
                    <p className="text-xs md:text-sm">770-410-8336 | www.commcapconnect.com | ©{new Date().getFullYear()}</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
