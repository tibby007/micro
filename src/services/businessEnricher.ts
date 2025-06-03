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

// Define a type for the enriched data structure your app expects
interface EnrichedProspectData {
  employeeCount?: number;
  revenue?: string;
  estimatedAnnualRevenue?: number;
  employeeRange?: string;
  industry?: string; // This will be determined by identifyIndustry or from Apollo
  contacts?: Array<{
    name: string;
    title: string;
    email: string | null;
    phone: string;
  }>;
  // Add any other fields Apollo might return that you want to use
  apolloSpecificField?: any;
  [key: string]: any; // Allow for other properties from prospect or Apollo
}


class BusinessEnricher {
  private industryKeywords: IndustryKeywords = {
    'Medical & Healthcare': ['medical', 'healthcare', 'clinic', 'hospital', 'dental', 'veterinary', 'health'],
    'Restaurant': ['restaurant', 'cafe', 'bakery', 'diner', 'kitchen'],
    'Retail & E-commerce': ['store', 'shop', 'retail', 'boutique', 'market', 'mall'],
    'Fitness & Wellness': ['gym', 'fitness', 'yoga', 'pilates', 'massage', 'spa', 'salon'],
    'Professional Services': ['consulting', 'law', 'accounting', 'insurance', 'real estate'],
    'Technology': ['software', 'tech', 'IT', 'computer', 'digital', 'data'],
    'Education': ['school', 'university', 'college', 'academy', 'training', 'education'],
    'Construction & Contractors': ['construction', 'contractor', 'builder', 'plumbing', 'electrical', 'hvac']
  };

  private equipmentByIndustry: { [industry: string]: EquipmentSuggestion[] } = {
    // ... your existing equipmentByIndustry data ... (keep as is)
    'Medical & Healthcare': [
      { equipment: 'Digital X-Ray System', estimatedBudget: '$15K-$45K', potentialDealSize: 30000, reasoning: 'Essential for modern medical diagnostics' },
      { equipment: 'Patient Monitoring Equipment', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Critical for patient care and safety' },
    ], // Add the rest
    'Restaurants & Food Service': [
      { equipment: 'POS System', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for order management and payments' },
    ], // Add the rest
    'Retail & E-commerce': [
      { equipment: 'POS & Payment System', estimatedBudget: '$2K-$8K', potentialDealSize: 5000, reasoning: 'Essential for transaction processing' },
    ], // Add the rest
    'Fitness & Wellness': [
      { equipment: 'Commercial Treadmills', estimatedBudget: '$5K-$15K', potentialDealSize: 10000, reasoning: 'Core cardio equipment for gyms' },
    ], // Add the rest
    'Auto Repair & Service': [
      { equipment: 'Diagnostic Equipment', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Critical for modern vehicle diagnostics' },
    ], // Add the rest
    'Professional Services': [
      { equipment: 'Office Technology', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for modern office operations' },
    ], // Add the rest
  };

  constructor() {
    // Constructor can be empty if no specific setup is needed at instantiation
  }

  // === PUBLIC METHOD CALLED BY YOUR COMPONENTS ===
  public async enrichProspects(prospectsList: any[]): Promise<any[]> {
    const allEnrichedProspects = [];

    for (const prospect of prospectsList) {
      let enrichedData: EnrichedProspectData = {};
      let determinedIndustry = 'General Business'; // Default industry

      try {
        // Step 1: Determine industry based on prospect name and types
        determinedIndustry = this.identifyIndustry(prospect.name || '', prospect.types || []);

        // Step 2: Get enriched data (either from API or mock)
        // For now, let's use mock data. We will switch to fetchDataFromApi later.
        enrichedData = await this.getMockEnrichedData(prospect.name || '', prospect.website || '', prospect.formatted_address || 'Unknown Location');
        
        // If using API in the future, it might look like:
        // enrichedData = await this.fetchDataFromApi(prospect.website || '');
        // And then you might merge identifyIndustry result if API doesn't provide a better one:
        // enrichedData.industry = enrichedData.industry || determinedIndustry;


        // Ensure the enrichedData includes an industry property, prioritizing API/mock, then identified
        if (!enrichedData.industry) {
            enrichedData.industry = determinedIndustry;
        }


        const finalProspect = {
          ...prospect, // Original prospect data
          ...enrichedData, // Data from mock/API
          microTicketScore: this.calculateMicroTicketScore(enrichedData),
          // The industry is now part of enrichedData, or already set
        };
        allEnrichedProspects.push(finalProspect);

      } catch (error) {
        console.error(`Error enriching prospect ${prospect.name || 'N/A'}:`, error);
        // Push prospect with minimal enrichment or error state
        allEnrichedProspects.push({
          ...prospect,
          microTicketScore: 0,
          industry: determinedIndustry, // Use identified industry even on error
          enrichmentError: (error as Error).message || 'Unknown enrichment error',
        });
      }
    }
    return allEnrichedProspects;
  }

  // === DATA FETCHING METHODS ===

  // Method to call your backend API route (to be implemented fully later)
  // You can remove the eslint-disable comment if you use the underscore
  private async _fetchDataFromApi(domain: string): Promise<EnrichedProspectData> { // Added underscore
    if (!domain) {
      console.warn("Domain is empty for API call, returning empty data.");
      return {};
    }
    try {
      console.log(`Fetching real data for domain: ${domain}`);
      const response = await fetch('/api/apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "Failed to parse error from API" }));
        throw new Error(`API request to /api/apollo failed: ${response.status} ${errorBody.error || ''}`);
      }
      const data = await response.json();
      // IMPORTANT: Transform `data` from Apollo to match EnrichedProspectData structure
      // Example:
      // if (data.organizations && data.organizations.length > 0) {
      //   const org = data.organizations[0];
      //   return {
      //     employeeCount: org.estimated_num_employees,
      //     revenue: org.annual_revenue, // Adjust field names
      //     // ... map other fields
      //   };
      // }
      console.log("Raw data from /api/apollo:", data);
      // For now, just return it; needs proper mapping
      return data.organizations && data.organizations.length > 0 ? data.organizations[0] : {}; 
    } catch (error) {
      console.error('Error in fetchDataFromApi:', error);
      throw error;
    }
  }

  // Renamed and corrected mock data function (was the second enrichWithMockData)
  // Now uses businessName and businessLocation as intended by its original signature
  private async getMockEnrichedData(businessName: string, domain: string, businessLocation: string): Promise<EnrichedProspectData> {
    console.log(`Getting mock data for: ${businessName} (${domain}) at ${businessLocation}`);
    const mockEmployeeCount = Math.floor(Math.random() * 50) + 5;
    const mockRevenueRanges = ['$100K - $500K', '$500K - $1M', '$1M - $5M'];
    const mockRevenue = mockRevenueRanges[Math.floor(Math.random() * mockRevenueRanges.length)];

    return {
      employeeCount: mockEmployeeCount,
      revenue: mockRevenue,
      estimatedAnnualRevenue: mockEmployeeCount * 75000, // Example calculation
      employeeRange: mockEmployeeCount < 10 ? '1-10' : mockEmployeeCount < 25 ? '11-25' : '26-50',
      // industry is often better set by identifyIndustry or from real API data
      // but we can provide a generic mock one if needed
      // industry: 'Mock Service Business', 
      contacts: [
        {
          name: businessName || 'Business Contact', // Use businessName
          title: 'Owner/Manager',
          email: domain ? `contact@${domain.replace(/^https?:\/\//, '')}` : null,
          phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        }
      ],
      // You can add businessName and businessLocation if your UI needs them directly from enrichedData
      originalBusinessName: businessName,
      originalBusinessLocation: businessLocation,
    };
  }

  // === HELPER METHODS ===
  public identifyIndustry(businessName: string, googleTypes: string[]): string {
    const name = businessName.toLowerCase();
    // Ensure googleTypes is an array before joining
    const typesString = Array.isArray(googleTypes) ? googleTypes.join(' ').toLowerCase() : '';
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      for (const keyword of keywords) {
        if (name.includes(keyword) || typesString.includes(keyword)) {
          return industry;
        }
      }
    }
    return 'General Business'; // Default if no match
  }

  public getEquipmentSuggestions(industry: string): string[] { // Made public if called from outside
    const suggestions = this.equipmentByIndustry[industry] || this.equipmentByIndustry['Professional Services'] || [];
    return suggestions.slice(0, 3).map(item => item.equipment);
  }

  private calculateMicroTicketScore(enrichedData: EnrichedProspectData): number {
    let score = 0;
    const employeeCount = enrichedData.employeeCount || 0;
    if (employeeCount >= 10) score += 3;
    else if (employeeCount >= 5) score += 2;
    else if (employeeCount >= 1) score += 1;

    if (enrichedData.estimatedAnnualRevenue) {
      if (enrichedData.estimatedAnnualRevenue >= 1000000) score += 3;
      else if (enrichedData.estimatedAnnualRevenue >= 500000) score += 2;
      else if (enrichedData.estimatedAnnualRevenue >= 100000) score += 1;
    }

    if (enrichedData.contacts && enrichedData.contacts.length > 0) {
      score += 2;
      if (enrichedData.contacts[0].email) score += 1;
      if (enrichedData.contacts[0].phone) score += 1;
    }
    return Math.min(score, 10);
  }
}

export default new BusinessEnricher();