// src/services/businessEnricher.ts

interface EquipmentSuggestion {
  equipment: string;
  estimatedBudget: string;
  potentialDealSize: number;
  reasoning: string;
}

interface IndustryKeywords {
  [key: string]: string[];
}

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
  marketCap?: string; // Added for market_cap
  [key: string]: any;
}

class BusinessEnricher {
  private industryKeywords: IndustryKeywords = {
    'Medical & Healthcare': ['medical', 'healthcare', 'clinic', 'hospital', 'dental', 'veterinary', 'health'],
    'Restaurant': ['restaurant', 'cafe', 'bakery', 'diner', 'kitchen', 'food service'],
    'Retail & E-commerce': ['store', 'shop', 'retail', 'boutique', 'market', 'mall', 'e-commerce'],
    'Fitness & Wellness': ['gym', 'fitness', 'yoga', 'pilates', 'massage', 'spa', 'salon', 'wellness'],
    'Professional Services': ['consulting', 'law', 'accounting', 'insurance', 'real estate', 'agency'],
    'Technology': ['software', 'tech', 'IT', 'computer', 'digital', 'data', 'saas', 'information technology & services', 'internet', 'computer software'], // Expanded based on Apollo data
    'Education': ['school', 'university', 'college', 'academy', 'training', 'education'],
    'Construction & Contractors': ['construction', 'contractor', 'builder', 'plumbing', 'electrical', 'hvac', 'roofing'],
    'Auto Repair & Service': ['auto repair', 'mechanic', 'automotive', 'car service', 'body shop'],
    'Marketing & Advertising': ['marketing & advertising', 'digital marketing', 'advertising', 'sem'], // Added based on Apollo data
  };

  private equipmentByIndustry: { [industry: string]: EquipmentSuggestion[] } = {
    // ... (Your full equipmentByIndustry data - I'll omit for brevity but ensure it's complete in your file)
    'Medical & Healthcare': [ { equipment: 'Digital X-Ray System', estimatedBudget: '$15K-$45K', potentialDealSize: 30000, reasoning: 'Essential for modern medical diagnostics' }, /* ... more ... */ ],
    'Restaurants & Food Service': [ { equipment: 'POS System & Kitchen Display System (KDS)', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for order management and payments' }, /* ... more ... */ ],
    'Retail & E-commerce': [ { equipment: 'Modern POS & Payment System', estimatedBudget: '$2K-$8K', potentialDealSize: 5000, reasoning: 'Essential for transaction processing and inventory' }, /* ... more ... */ ],
    'Fitness & Wellness': [ { equipment: 'Commercial Treadmills & Ellipticals', estimatedBudget: '$5K-$15K per unit', potentialDealSize: 10000, reasoning: 'Core cardio equipment for gyms' }, /* ... more ... */ ],
    'Auto Repair & Service': [ { equipment: 'Advanced Diagnostic Scanner', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Critical for modern vehicle diagnostics and repair' }, /* ... more ... */ ],
    'Professional Services': [ { equipment: 'Office Technology Suite (PCs, Monitors, Printers)', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for modern office operations and productivity' }, /* ... more ... */ ],
    'Construction & Contractors': [ { equipment: 'Skid Steer Loader or Mini Excavator', estimatedBudget: '$20K-$45K', potentialDealSize: 32500, reasoning: 'Versatile equipment for various job sites.' }, /* ... more ... */ ],
    'Salons & Spas': [ { equipment: 'Hydraulic Styling Chairs & Backwash Units', estimatedBudget: '$3K-$10K', potentialDealSize: 6500, reasoning: 'Core furniture for hair salon services.' }, /* ... more ... */ ],
    'Hotels & Hospitality': [ { equipment: 'Property Management System (PMS) Hardware', estimatedBudget: '$5K-$20K', potentialDealSize: 12500, reasoning: 'Core system for managing reservations, billing, and guest data.' }, /* ... more ... */ ],
    'Technology': [ 
        { equipment: 'Cloud Computing Credits/Services', estimatedBudget: '$5K-$20K', potentialDealSize: 12500, reasoning: 'Essential for scalable infrastructure.' },
        { equipment: 'Cybersecurity Solutions', estimatedBudget: '$3K-$15K', potentialDealSize: 9000, reasoning: 'Protects data and systems.' },
        { equipment: 'AI/ML Development Tools & Platforms', estimatedBudget: '$10K-$40K', potentialDealSize: 25000, reasoning: 'For innovation and product development.' },
    ],
    'Marketing & Advertising': [
        { equipment: 'CRM & Marketing Automation Software', estimatedBudget: '$2K-$10K', potentialDealSize: 6000, reasoning: 'Manages leads and automates campaigns.'},
        { equipment: 'High-Performance Workstations (for design/video)', estimatedBudget: '$3K-$8K per unit', potentialDealSize: 5500, reasoning: 'For creative content production.'},
        { equipment: 'Analytics & Reporting Tools Subscription', estimatedBudget: '$500-$2K monthly', potentialDealSize: 1250*12, reasoning: 'Tracks campaign performance and ROI.'} // Example annual deal
    ],
    'General Business': [ { equipment: 'Office Furniture (Desks, Chairs, Filing Cabinets)', estimatedBudget: '$2K-$10K', potentialDealSize: 6000, reasoning: 'Basic setup for any office environment.'}, /* ... more ... */ ]
  };

  constructor() {}

  public async enrichProspects(prospectsList: any[]): Promise<any[]> {
    console.log("BusinessEnricher: Starting to enrich", prospectsList.length, "prospects.");
    const allEnrichedProspects = [];

    for (const prospect of prospectsList) {
      let enrichedData: EnrichedProspectData = {};
      let determinedIndustry = 'General Business'; 

      try {
        // Try to get a preliminary industry from Google data if available
        let initialIndustry = prospect.industry || ''; // Assuming GooglePlacesService might add an 'industry' field based on primary type
        if (!initialIndustry && prospect.types && prospect.types.length > 0) {
            // Attempt to map a primary Google type to one of our known industries
            initialIndustry = this.mapGoogleTypeToIndustry(prospect.types);
        }
        
        determinedIndustry = this.identifyIndustry(prospect.name || '', prospect.types || []);
        console.log(`BusinessEnricher: Prospect "${prospect.name}", Google-based Industry Attempt: "${initialIndustry}", Keywords Identified Industry: "${determinedIndustry}"`);
        
        console.log(`BusinessEnricher: Attempting to fetch REAL data for domain: "${prospect.website || 'N/A'}"`);
        enrichedData = await this._fetchDataFromApi(prospect.website || ''); 
        
        // Logic to determine final industry: Apollo > Keyword-Identified > Google-based > Fallback
        if (enrichedData.industry) {
            // Apollo provided an industry, prefer this.
        } else if (determinedIndustry && determinedIndustry !== 'General Business') { 
            enrichedData.industry = determinedIndustry;
        } else if (initialIndustry && initialIndustry !== 'General Business') {
            enrichedData.industry = initialIndustry;
        } else { 
            enrichedData.industry = 'General Business';
        }
        console.log(`BusinessEnricher: Data after enrichment/API for "${prospect.name}":`, JSON.stringify(enrichedData, null, 2));

        const finalProspect = {
          ...prospect, 
          ...enrichedData, 
          microTicketScore: this.calculateMicroTicketScore(enrichedData),
        };
        allEnrichedProspects.push(finalProspect);

      } catch (error) {
        console.error(`BusinessEnricher: Error enriching prospect ${prospect.name || 'N/A'}:`, error);
        allEnrichedProspects.push({
          ...prospect,
          microTicketScore: 0,
          industry: determinedIndustry, // Fallback to keyword-identified on error
          enrichmentError: (error as Error).message || 'Unknown enrichment error',
        });
      }
    }
    console.log("BusinessEnricher: Finished enriching prospects. Total enriched:", allEnrichedProspects.length);
    return allEnrichedProspects;
  }

  private async _fetchDataFromApi(domain: string): Promise<EnrichedProspectData> {
    if (!domain) {
      console.warn(`BusinessEnricher (_fetchDataFromApi): Domain is empty for API call, returning empty data.`);
      return {};
    }
    try {
      console.log(`BusinessEnricher (_fetchDataFromApi): Fetching REAL data for domain: ${domain}`);
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
      const data = await response.json(); // This is the full response from /api/apollo
      
      // This log shows the structure of 'data' which contains the 'organizations' array
      console.log(`BusinessEnricher (_fetchDataFromApi): RAW APOLLO DATA from /api/apollo for domain "${domain}":`, JSON.stringify(data, null, 2));

      if (data.organizations && data.organizations.length > 0) {
        const org = data.organizations[0]; // This is the specific organization object
        
        console.log("RAW ORG OBJECT FROM APOLLO (inside if):", JSON.stringify(org, null, 2));

        // --- START CRITICAL MAPPING ---
        const mappedData: EnrichedProspectData = {
          // Fields confirmed from your Apollo log for "Google":
          employeeCount: org.estimated_num_employees,
          industry: org.industry, // This is often quite good from Apollo
          website: org.website_url,
          foundedYear: org.founded_year,
          keywords: org.keywords, // This is an array
          marketCap: org.market_cap, // This is a string like "652.3B"

          // Fields to VERIFY from your FULL "RAW ORG OBJECT" console log:
          revenue: org.annual_revenue_formatted || org.revenue_range || org.formatted_revenue, // Example: "$100M - $250M" - LOOK FOR THIS
          estimatedAnnualRevenue: org.annual_revenue, // Example: 100000000 (number) - LOOK FOR THIS
          employeeRange: org.employees_range || org.headcount_range, // Example: "10001+" or "500-1000" - LOOK FOR THIS

          // Contacts: Apollo's contact/people data can be nested. 
          // Look for an array like 'people', 'contacts', 'key_people', 'contact_profiles' in the 'org' object.
          
          contacts: org.people ? org.people.slice(0, 2).map((p: any) => ({ 
            name: p.name || 'N/A',
            title: p.title || p.headline || 'N/A', 
            email: p.email || (p.emails && p.emails.length > 0 ? p.emails[0].address : null), 
            phone: p.primary_phone?.sanitized_number || (p.phone_numbers && p.phone_numbers.length > 0 ? p.phone_numbers[0].sanitized_number : null), 
          })) : (org.primary_phone ? [{ // Fallback
                name: org.name || 'Main Contact', 
                title: 'General Contact',
                email: null, 
                phone: org.primary_phone.sanitized_number || org.primary_phone.number
            }] : []),
          
          apolloSourceData: org 
        };
        // --- END CRITICAL MAPPING ---
        console.log(`BusinessEnricher (_fetchDataFromApi): Mapped Apollo data for "${domain}":`, JSON.stringify(mappedData, null, 2));
        return mappedData;
      } else { 
        console.warn(`BusinessEnricher (_fetchDataFromApi): No 'organizations' array or empty array in response from Apollo for domain: ${domain}`);
        return {}; 
      }
    } catch (error) {
      console.error(`BusinessEnricher (_fetchDataFromApi): Error fetching/processing data for domain ${domain}:`, error);
      throw error; 
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getMockEnrichedData(businessName: string, domain: string, businessLocation: string): Promise<EnrichedProspectData> {
    // ... (mock data function remains the same) ...
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
      contacts: [
        {
          name: businessName || 'Business Contact', 
          title: ['Owner', 'Manager', 'CEO', 'President'][Math.floor(Math.random() * 4)],
          email: domain ? `contact@${domain.replace(/^https?:\/\//, '')}` : null,
          phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        }
      ],
      originalBusinessName: businessName, 
      originalBusinessLocation: businessLocation,
    };
  }

  // Helper to try and map Google's primary type to our defined industries
  private mapGoogleTypeToIndustry(googleTypes: string[]): string {
    if (!googleTypes || googleTypes.length === 0) return 'General Business';
    const primaryGoogleType = googleTypes[0].replace(/_/g, ' ').toLowerCase(); // e.g., "auto_repair" -> "auto repair"

    for (const [definedIndustry, keywords] of Object.entries(this.industryKeywords)) {
        if (keywords.some(kw => primaryGoogleType.includes(kw))) {
            return definedIndustry;
        }
    }
    // Specific common mappings
    if (primaryGoogleType.includes('restaurant') || primaryGoogleType.includes('food') || primaryGoogleType.includes('cafe')) return 'Restaurants & Food Service';
    if (primaryGoogleType.includes('store') || primaryGoogleType.includes('retail') || primaryGoogleType.includes('shop')) return 'Retail & E-commerce';
    if (primaryGoogleType.includes('health') || primaryGoogleType.includes('clinic') || primaryGoogleType.includes('doctor') || primaryGoogleType.includes('dental')) return 'Medical & Healthcare';
    // Add more direct mappings if needed
    return 'General Business'; // Fallback
  }


  public identifyIndustry(businessName: string, googleTypes: string[]): string {
    const name = businessName.toLowerCase();
    const typesString = Array.isArray(googleTypes) ? googleTypes.join(' ').toLowerCase() : '';
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      for (const keyword of keywords) {
        if (name.includes(keyword) || typesString.includes(keyword)) {
          return industry;
        }
      }
    }
    if (typesString.includes('information technology & services') || name.includes('information technology & services')) {
        return 'Technology';
    }
    if (typesString.includes('marketing') || name.includes('marketing') || typesString.includes('advertising') || name.includes('advertising')) {
        return 'Marketing & Advertising';
    }
    return 'General Business'; 
  }

  public getEquipmentSuggestions(industry: string): string[] { 
    // Try to find a more specific match first
    let targetIndustryKey = Object.keys(this.industryKeywords).find(key => {
        const lowerIndustry = industry.toLowerCase();
        if (key.toLowerCase() === lowerIndustry) return true;
        return this.industryKeywords[key].some(keyword => lowerIndustry.includes(keyword));
    });

    if (!targetIndustryKey || !this.equipmentByIndustry[targetIndustryKey]) {
        targetIndustryKey = 'General Business'; // Fallback
    }
    
    const suggestions = this.equipmentByIndustry[targetIndustryKey] || this.equipmentByIndustry['General Business'] || [];
    return suggestions.slice(0, 3).map(item => `${item.equipment} (Est: ${item.estimatedBudget})`);
  }

  private calculateMicroTicketScore(enrichedData: EnrichedProspectData): number {
    let score = 0;
    const employeeCount = enrichedData.employeeCount || 0;
    if (employeeCount >= 20) score += 3; 
    else if (employeeCount >= 10) score += 2;
    else if (employeeCount >= 5) score += 1;

    // Use marketCap as a proxy for revenue if actual revenue numbers are hard to get/parse
    if (enrichedData.marketCap && typeof enrichedData.marketCap === 'string') {
        if (enrichedData.marketCap.includes('B')) score += 3; // Billion
        else if (enrichedData.marketCap.includes('M')) score += 2; // Million
    } else if (enrichedData.estimatedAnnualRevenue) { // Fallback to estimatedAnnualRevenue
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