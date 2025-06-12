// src/services/businessEnricher.ts

import GooglePlacesService from './GooglePlacesService';
import type { Business } from './GooglePlacesService'; 

export interface EnrichedProspectData {
  employeeCount?: number;
  revenue?: string; 
  estimatedAnnualRevenue?: number; 
  employeeRange?: string; 
  industry?: string;
  contacts?: Array<{
    name: string;
    title: string;
    email: string | null;
    phone: string | null;
  }>;
  apolloSourceData?: any;
  website?: string; 
  foundedYear?: number; 
  keywords?: string[]; 
  marketCap?: string; 
  enrichmentSkippedReason?: string; // <<<< ADD THIS LINE
  [key: string]: any;
}

interface EquipmentSuggestion {
  equipment: string;
  estimatedBudget: string;
  potentialDealSize: number;
  reasoning: string;
}

interface IndustryKeywords {
  [key: string]: string[];
}

class BusinessEnricher {
  private industryKeywords: IndustryKeywords = {
    'Medical & Healthcare': ['medical', 'healthcare', 'clinic', 'hospital', 'dental', 'veterinary', 'health'],
    'Restaurant': ['restaurant', 'cafe', 'bakery', 'diner', 'kitchen', 'food service'],
    'Retail & E-commerce': ['store', 'shop', 'retail', 'boutique', 'market', 'mall', 'e-commerce'],
    'Fitness & Wellness': ['gym', 'fitness', 'yoga', 'pilates', 'massage', 'spa', 'salon', 'wellness'],
    'Professional Services': ['consulting', 'law', 'accounting', 'insurance', 'real estate', 'agency'],
    'Technology': ['software', 'tech', 'IT', 'computer', 'digital', 'data', 'saas', 'information technology & services', 'internet', 'computer software'],
    'Education': ['school', 'university', 'college', 'academy', 'training', 'education'],
    'Construction & Contractors': ['construction', 'contractor', 'builder', 'plumbing', 'electrical', 'hvac', 'roofing'],
    'Auto Repair & Service': ['auto repair', 'mechanic', 'automotive', 'car service', 'body shop'],
    'Marketing & Advertising': ['marketing & advertising', 'digital marketing', 'advertising', 'sem'],
  };

  private equipmentByIndustry: { [industry: string]: EquipmentSuggestion[] } = {
    // ... (Your full equipmentByIndustry data - ensure it's complete)
    'Medical & Healthcare': [ { equipment: 'Digital X-Ray System', estimatedBudget: '$15K-$45K', potentialDealSize: 30000, reasoning: 'Essential for modern medical diagnostics' }, /* ... more ... */ ],
    'Restaurants & Food Service': [ { equipment: 'POS System & Kitchen Display System (KDS)', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for order management and payments' }, /* ... more ... */ ],
    'Retail & E-commerce': [ { equipment: 'Modern POS & Payment System', estimatedBudget: '$2K-$8K', potentialDealSize: 5000, reasoning: 'Essential for transaction processing and inventory' }, /* ... more ... */ ],
    'Fitness & Wellness': [ { equipment: 'Commercial Treadmills & Ellipticals', estimatedBudget: '$5K-$15K per unit', potentialDealSize: 10000, reasoning: 'Core cardio equipment for gyms' }, /* ... more ... */ ],
    'Auto Repair & Service': [ { equipment: 'Advanced Diagnostic Scanner', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Critical for modern vehicle diagnostics and repair' }, /* ... more ... */ ],
    'Professional Services': [ { equipment: 'Office Technology Suite (PCs, Monitors, Printers)', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for modern office operations and productivity' }, /* ... more ... */ ],
    'Construction & Contractors': [ { equipment: 'Skid Steer Loader or Mini Excavator', estimatedBudget: '$20K-$45K', potentialDealSize: 32500, reasoning: 'Versatile equipment for various job sites.' }, /* ... more ... */ ],
    'Salons & Spas': [ { equipment: 'Hydraulic Styling Chairs & Backwash Units', estimatedBudget: '$3K-$10K', potentialDealSize: 6500, reasoning: 'Core furniture for hair salon services.' }, /* ... more ... */ ],
    'Hotels & Hospitality': [ { equipment: 'Property Management System (PMS) Hardware', estimatedBudget: '$5K-$20K', potentialDealSize: 12500, reasoning: 'Core system for managing reservations, billing, and guest data.' }, /* ... more ... */ ],
    'Technology': [ { equipment: 'Cloud Computing Credits/Services', estimatedBudget: '$5K-$20K', potentialDealSize: 12500, reasoning: 'Essential for scalable infrastructure.' }, /* ... more ... */ ],
    'Marketing & Advertising': [ { equipment: 'CRM & Marketing Automation Software', estimatedBudget: '$2K-$10K', potentialDealSize: 6000, reasoning: 'Manages leads and automates campaigns.'}, /* ... more ... */ ],
    'General Business': [ { equipment: 'Office Furniture (Desks, Chairs, Filing Cabinets)', estimatedBudget: '$2K-$10K', potentialDealSize: 6000, reasoning: 'Basic setup for any office environment.'}, /* ... more ... */ ]
  };

  constructor() {}

  public async enrichProspects(initialProspects: Partial<Business>[]): Promise<any[]> {
    console.log("BusinessEnricher: Starting to enrich", initialProspects.length, "initial prospects.");
    const allEnrichedProspects = [];

    for (const initialProspect of initialProspects) {
        let prospectWithDetails: Partial<Business> & { enrichmentError?: string } = { ...initialProspect }; 
        let enrichedData: EnrichedProspectData = {};
        let determinedIndustryByKeywords = 'General Business';
        let googleBasedIndustry = 'General Business'; 
        let finalIndustryForDisplay = 'General Business';

        try {
            if (prospectWithDetails.id && prospectWithDetails.id !== 'NO_PLACE_ID' && !prospectWithDetails.enrichmentError) { 
                console.log(`BusinessEnricher: Getting Google Place Details for ID: ${prospectWithDetails.id}, Name: ${prospectWithDetails.name}`);
                try {
                    const details = await GooglePlacesService.getBusinessDetails(prospectWithDetails.id);
                    prospectWithDetails = { 
                        ...initialProspect, 
                        name: details.name || initialProspect.name,
                        address: details.address || initialProspect.address,
                        phone: details.phone || initialProspect.phone,
                        rating: details.rating !== undefined ? details.rating : initialProspect.rating,
                        website: details.website || initialProspect.website,
                        types: details.types && details.types.length > 0 ? details.types : initialProspect.types,
                        url: details.url || initialProspect.url,
                        enrichmentError: details.enrichmentError, // <-- This is correct for an object
                      };                      
                    console.log(`BusinessEnricher: Details for ${prospectWithDetails.name || 'N/A'}: Website - ${prospectWithDetails.website}, Phone - ${prospectWithDetails.phone}`);
                    if (prospectWithDetails.enrichmentError) {
                        console.warn(`BusinessEnricher: Google Details fetch for ${prospectWithDetails.name || 'N/A'} had an error: ${prospectWithDetails.enrichmentError}`);
                    }
                } catch (detailsError) {
                    console.error(`BusinessEnricher: CRITICAL Error getting Google Place Details for ${prospectWithDetails.name || 'N/A'}:`, detailsError);
                    prospectWithDetails.enrichmentError = (detailsError as Error).message || "Failed to get Google Details";
                }
            } else {
                console.warn(`BusinessEnricher: Skipping Google Place Details for prospect with missing/invalid ID or prior error:`, initialProspect);
                 if(!prospectWithDetails.enrichmentError) prospectWithDetails.enrichmentError = "Missing Place ID for details."
            }
            
            googleBasedIndustry = this.mapGoogleTypeToIndustry(prospectWithDetails.types || []); 
            determinedIndustryByKeywords = this.identifyIndustry(prospectWithDetails.name || '', prospectWithDetails.types || []);
            console.log(`BusinessEnricher: Prospect "${prospectWithDetails.name || 'N/A'}", GoogleTypeMapped Industry: "${googleBasedIndustry}", Keywords Identified Industry: "${determinedIndustryByKeywords}"`);
            
            if (prospectWithDetails.website && !prospectWithDetails.enrichmentError) {
                console.log(`BusinessEnricher: Attempting to fetch REAL data for domain: "${prospectWithDetails.website}" (Prospect Name: ${prospectWithDetails.name || 'N/A'})`);
                enrichedData = await this._fetchDataFromApi(prospectWithDetails.website, prospectWithDetails.name || 'Unknown Prospect'); 
            } else {
                console.log(`BusinessEnricher: Skipping Apollo fetch for "${prospectWithDetails.name || 'N/A'}" due to missing website or prior Google Details error.`);
                if (!enrichedData.enrichmentSkippedReason && !prospectWithDetails.enrichmentError) {
                   enrichedData.enrichmentSkippedReason = "Missing website for Apollo enrichment";
                } else if (!enrichedData.enrichmentSkippedReason && prospectWithDetails.enrichmentError) {
                   enrichedData.enrichmentSkippedReason = `Skipped due to Google Details error: ${prospectWithDetails.enrichmentError}`;
                }
            }

            if (enrichedData.enrichmentSkippedReason) {
                console.log(`BusinessEnricher: Apollo enrichment explicitly skipped for "${prospectWithDetails.name || 'N/A'}". Reason: ${enrichedData.enrichmentSkippedReason}`);
                if (!enrichedData.industry) { 
                    if (determinedIndustryByKeywords && determinedIndustryByKeywords !== 'General Business') { 
                        enrichedData.industry = determinedIndustryByKeywords;
                    } else if (googleBasedIndustry && googleBasedIndustry !== 'General Business') {
                        enrichedData.industry = googleBasedIndustry;
                    } else {
                        enrichedData.industry = 'General Business';
                    }
                }
            } else { // Apollo data was (attempted to be) used
                if (enrichedData.industry && enrichedData.industry !== 'General Business') {
                    finalIndustryForDisplay = enrichedData.industry;
                } else if (determinedIndustryByKeywords && determinedIndustryByKeywords !== 'General Business') { 
                    finalIndustryForDisplay = determinedIndustryByKeywords;
                } else if (googleBasedIndustry && googleBasedIndustry !== 'General Business') {
                    finalIndustryForDisplay = googleBasedIndustry;
                } else {
                    finalIndustryForDisplay = 'General Business';
                }
                enrichedData.industry = finalIndustryForDisplay; 
            }
            
            console.log(`BusinessEnricher: Data after enrichment/API for "${prospectWithDetails.name || 'N/A'}":`, JSON.stringify(enrichedData, null, 2));

            const finalProspect = {
              ...prospectWithDetails, 
              ...(enrichedData.enrichmentSkippedReason 
                    ? { industry: enrichedData.industry, enrichmentError: (prospectWithDetails.enrichmentError || enrichedData.enrichmentSkippedReason) } 
                    : enrichedData),
              microTicketScore: this.calculateMicroTicketScore(enrichedData),
            };
            // Ensure final industry is consistently named
            finalProspect.industry = enrichedData.industry || prospectWithDetails.industry || determinedIndustryByKeywords || googleBasedIndustry || 'General Business';

            allEnrichedProspects.push(finalProspect);

        } catch (error) { 
            console.error(`BusinessEnricher: Outer error enriching prospect ${prospectWithDetails.name || 'N/A'}:`, error);
            allEnrichedProspects.push({
              ...prospectWithDetails, 
              microTicketScore: 0,
              industry: determinedIndustryByKeywords || googleBasedIndustry || 'General Business', 
              enrichmentError: prospectWithDetails.enrichmentError || (error as Error).message || 'Unknown enrichment error',
            });
        }
    }
    console.log("BusinessEnricher: Finished enriching prospects. Total enriched:", allEnrichedProspects.length);
    return allEnrichedProspects;
}
  private async _fetchDataFromApi(domain: string, prospectNameFromGoogle: string): Promise<EnrichedProspectData> {
    if (!domain) {
      console.warn(`BusinessEnricher (_fetchDataFromApi): Domain is empty for API call (Prospect: ${prospectNameFromGoogle}), returning empty data.`);
      return { enrichmentSkippedReason: "Domain was empty" };
    }
    try {
      console.log(`BusinessEnricher (_fetchDataFromApi): Fetching REAL data for domain: ${domain} (Prospect: ${prospectNameFromGoogle})`);
      const response = await fetch('/api/apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "Failed to parse error from API" }));
        console.error(`BusinessEnricher (_fetchDataFromApi): API request to /api/apollo failed for domain ${domain}: ${response.status} ${errorBody.error || ''}`);
        throw new Error(`API request to /api/apollo failed: ${response.status} ${errorBody.error || ''}`);
      }
      const data = await response.json();
      console.log(`BusinessEnricher (_fetchDataFromApi): RAW APOLLO DATA from /api/apollo for domain "${domain}":`, JSON.stringify(data, null, 2));

      if (data.organizations && data.organizations.length > 0) {
        const org = data.organizations[0];
        console.log("RAW ORG OBJECT FROM APOLLO (inside if):", JSON.stringify(org, null, 2));

        // ---- CHECK FOR GENERIC/UNRELATED APOLLO FALLBACK ----
        const inputDomainHost = new URL(domain).hostname.replace(/^www\./, '').toLowerCase();
        const apolloOrgName = (org.name || '').toLowerCase();
        const apolloPrimaryDomain = (org.primary_domain || '').toLowerCase();
        const apolloWebsiteUrlDomain = org.website_url ? new URL(org.website_url).hostname.replace(/^www\./, '').toLowerCase() : '';
        
        let skipReason = "";

        if (apolloOrgName === "google" && !inputDomainHost.includes("google")) {
            skipReason = `Apollo returned generic 'Google' data for non-Google domain ${domain}`;
        } else {
            // Check if Apollo's returned domain strongly mismatches the input domain AND the names also don't match.
            // This is a heuristic to catch cases where Apollo might return a completely unrelated company.
            let domainEssentiallyMatches = false;
            if (inputDomainHost === apolloPrimaryDomain || inputDomainHost === apolloWebsiteUrlDomain) {
                domainEssentiallyMatches = true;
            } else if (apolloPrimaryDomain && inputDomainHost.includes(apolloPrimaryDomain)) {
                domainEssentiallyMatches = true;
            } else if (apolloWebsiteUrlDomain && inputDomainHost.includes(apolloWebsiteUrlDomain)) {
                domainEssentiallyMatches = true;
            }


            if (!domainEssentiallyMatches && prospectNameFromGoogle.toLowerCase() !== apolloOrgName) {
                 skipReason = `Apollo returned data for '${org.name}' (domain: ${apolloPrimaryDomain || apolloWebsiteUrlDomain}) which seems unrelated to input domain '${domain}' (Prospect: ${prospectNameFromGoogle}).`;
            }
        }

        if (skipReason) {
            console.warn(`BusinessEnricher (_fetchDataFromApi): ${skipReason}. Discarding Apollo enrichment.`);
            return { enrichmentSkippedReason: skipReason };
        }
        // ---- END CHECK ----

        const mappedData: EnrichedProspectData = {
          employeeCount: org.estimated_num_employees,
          industry: org.industry,
          website: org.website_url,
          foundedYear: org.founded_year,
          keywords: org.keywords,
          marketCap: org.market_cap,
          revenue: org.annual_revenue_formatted || org.revenue_range, 
          estimatedAnnualRevenue: org.annual_revenue, 
          employeeRange: org.employees_range || org.headcount_range, 
          contacts: org.primary_phone ? [{
                name: org.name || 'Main Contact', 
                title: 'General Contact',
                email: null, 
                phone: org.primary_phone.sanitized_number || org.primary_phone.number
            }] : [], // TODO: Still need to map actual 'people' array from Apollo if it exists
          apolloSourceData: org 
        };
        console.log(`BusinessEnricher (_fetchDataFromApi): Mapped Apollo data for "${domain}":`, JSON.stringify(mappedData, null, 2));
        return mappedData;
      } else { 
        console.warn(`BusinessEnricher (_fetchDataFromApi): No 'organizations' array or empty array in response from Apollo for domain: ${domain}`);
        return { enrichmentSkippedReason: `No organization found by Apollo for domain ${domain}` }; 
      }
    } catch (error) {
      console.error(`BusinessEnricher (_fetchDataFromApi): Error fetching/processing data for domain ${domain}:`, error);
      throw error; 
    }
}
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getMockEnrichedData(businessName: string, domain: string, businessLocation: string): Promise<EnrichedProspectData> {
    console.log(`BusinessEnricher: Getting MOCK data for: ${businessName} (${domain}) at ${businessLocation}`);
    const mockEmployeeCount = Math.floor(Math.random() * 45) + 5; 
    const mockRevenueRanges = ['$100K - $500K', '$500K - $1M', '$1M - $5M', '$5M - $10M'];
    const mockRevenue = mockRevenueRanges[Math.floor(Math.random() * mockRevenueRanges.length)];
    const estimatedAnnual = [250000, 750000, 2000000, 7000000][mockRevenueRanges.indexOf(mockRevenue)] || mockEmployeeCount * 60000;

    return {
      employeeCount: mockEmployeeCount,
      revenue: mockRevenue,
      estimatedAnnualRevenue: estimatedAnnual, 
      employeeRange: mockEmployeeCount < 10 ? '1-10' : mockEmployeeCount < 25 ? '11-25' : mockEmployeeCount < 51 ? '26-50' : '50+',
      contacts: [ { name: businessName || 'Business Contact', title: ['Owner', 'Manager', 'CEO', 'President'][Math.floor(Math.random() * 4)], email: domain ? `contact@${domain.replace(/^https?:\/\//, '')}` : null, phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` } ],
      originalBusinessName: businessName, 
      originalBusinessLocation: businessLocation,
    };
  }

  private mapGoogleTypeToIndustry(googleTypes: string[]): string {
    if (!googleTypes || googleTypes.length === 0) return 'General Business';
    const primaryGoogleType = googleTypes[0].replace(/_/g, ' ').toLowerCase(); 
    for (const [definedIndustry, keywords] of Object.entries(this.industryKeywords)) {
        if (keywords.some(kw => primaryGoogleType.includes(kw))) { return definedIndustry; }
    }
    if (primaryGoogleType.includes('restaurant') || primaryGoogleType.includes('food') || primaryGoogleType.includes('cafe')) return 'Restaurants & Food Service';
    if (primaryGoogleType.includes('store') || primaryGoogleType.includes('retail') || primaryGoogleType.includes('shop')) return 'Retail & E-commerce';
    if (primaryGoogleType.includes('health') || primaryGoogleType.includes('clinic') || primaryGoogleType.includes('doctor') || primaryGoogleType.includes('dental')) return 'Medical & Healthcare';
    if (primaryGoogleType.includes('information technology') || primaryGoogleType.includes('computer software') || primaryGoogleType.includes('internet')) return 'Technology';
    if (primaryGoogleType.includes('marketing') || primaryGoogleType.includes('advertising')) return 'Marketing & Advertising';
    return 'General Business';
  }

  public identifyIndustry(businessName: string, googleTypes: string[]): string {
    const name = businessName.toLowerCase();
    const typesString = Array.isArray(googleTypes) ? googleTypes.join(' ').toLowerCase() : '';
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      for (const keyword of keywords) {
        if (name.includes(keyword) || typesString.includes(keyword)) { return industry; }
      }
    }
    if (typesString.includes('information technology & services') || name.includes('information technology & services') || typesString.includes('computer software') || name.includes('computer software')) return 'Technology';
    if (typesString.includes('marketing') || name.includes('marketing') || typesString.includes('advertising') || name.includes('advertising')) return 'Marketing & Advertising';
    return 'General Business'; 
  }

  public getEquipmentSuggestions(industry: string): string[] { 
    let targetIndustryKey = Object.keys(this.industryKeywords).find(key => {
        const lowerIndustry = industry.toLowerCase();
        if (key.toLowerCase() === lowerIndustry) return true;
        return this.industryKeywords[key].some(keyword => lowerIndustry.includes(keyword));
    });
    if (!targetIndustryKey || !this.equipmentByIndustry[targetIndustryKey]) {
        targetIndustryKey = 'General Business'; 
    }
    const suggestions = this.equipmentByIndustry[targetIndustryKey] || this.equipmentByIndustry['General Business'] || [];
    return suggestions.slice(0, 3).map(item => `${item.equipment} (Est: ${item.estimatedBudget})`);
  }

  private calculateMicroTicketScore(enrichedData: EnrichedProspectData): number {
    let score = 0;
    if (enrichedData.enrichmentSkippedReason) return 0; // No score if Apollo data was skipped or irrelevant

    const employeeCount = enrichedData.employeeCount || 0;
    if (employeeCount >= 20) score += 3; 
    else if (employeeCount >= 10) score += 2;
    else if (employeeCount >= 5) score += 1;

    if (enrichedData.marketCap && typeof enrichedData.marketCap === 'string') {
        if (enrichedData.marketCap.includes('B')) score += 3; 
        else if (enrichedData.marketCap.includes('M')) score += 2; 
    } else if (enrichedData.estimatedAnnualRevenue) { 
      if (enrichedData.estimatedAnnualRevenue >= 2000000) score += 3; 
      else if (enrichedData.estimatedAnnualRevenue >= 750000) score += 2;
      else if (enrichedData.estimatedAnnualRevenue >= 250000) score += 1;
    }

    if (enrichedData.contacts && enrichedData.contacts.length > 0) {
      score += 2; 
      if (enrichedData.contacts[0].email) score += 1;
      if (enrichedData.contacts[0].phone) score += 1;
    }
    
    const goodTargetIndustries = ['Medical & Healthcare', 'Auto Repair & Service', 'Construction & Contractors', 'Technology', 'Restaurants & Food Service'];
    if (enrichedData.industry && goodTargetIndustries.includes(enrichedData.industry)) {
        score += 1;
    }
    return Math.min(score, 10);
  }
}

export default new BusinessEnricher();