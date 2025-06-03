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
    'Restaurant': ['restaurant', 'cafe', 'bakery', 'diner', 'kitchen'],
    'Retail & E-commerce': ['store', 'shop', 'retail', 'boutique', 'market', 'mall'],
    'Fitness & Wellness': ['gym', 'fitness', 'yoga', 'pilates', 'massage', 'spa', 'salon'],
    'Professional Services': ['consulting', 'law', 'accounting', 'insurance', 'real estate'],
    'Technology': ['software', 'tech', 'IT', 'computer', 'digital', 'data'],
    'Education': ['school', 'university', 'college', 'academy', 'training', 'education'],
    'Construction & Contractors': ['construction', 'contractor', 'builder', 'plumbing', 'electrical', 'hvac']
  };

  private equipmentByIndustry: { [industry: string]: EquipmentSuggestion[] } = {
    'Medical & Healthcare': [
      { equipment: 'Digital X-Ray System', estimatedBudget: '$15K-$45K', potentialDealSize: 30000, reasoning: 'Essential for modern medical diagnostics' },
      { equipment: 'Patient Monitoring Equipment', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Critical for patient care and safety' },
      { equipment: 'Ultrasound Machine', estimatedBudget: '$12K-$35K', potentialDealSize: 23500, reasoning: 'High-demand diagnostic tool' },
      { equipment: 'EMR Software & Hardware', estimatedBudget: '$5K-$15K', potentialDealSize: 10000, reasoning: 'Required for regulatory compliance' },
      { equipment: 'Dental Chair & Equipment', estimatedBudget: '$10K-$30K', potentialDealSize: 20000, reasoning: 'Core equipment for dental practices' }
    ],
    'Restaurants & Food Service': [
      { equipment: 'POS System', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for order management and payments' },
      { equipment: 'Commercial Oven', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Core cooking equipment for food production' },
      { equipment: 'Refrigeration Unit', estimatedBudget: '$4K-$15K', potentialDealSize: 9500, reasoning: 'Critical for food safety and storage' },
      { equipment: 'Food Prep Equipment', estimatedBudget: '$2K-$8K', potentialDealSize: 5000, reasoning: 'Improves efficiency and food quality' },
      { equipment: 'Espresso Machine', estimatedBudget: '$5K-$20K', potentialDealSize: 12500, reasoning: 'High-margin beverage equipment' }
    ],
    'Retail & E-commerce': [
      { equipment: 'POS & Payment System', estimatedBudget: '$2K-$8K', potentialDealSize: 5000, reasoning: 'Essential for transaction processing' },
      { equipment: 'Security Camera System', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Critical for loss prevention' },
      { equipment: 'Display Fixtures', estimatedBudget: '$4K-$15K', potentialDealSize: 9500, reasoning: 'Enhances product presentation and sales' },
      { equipment: 'Inventory Scanners', estimatedBudget: '$2K-$6K', potentialDealSize: 4000, reasoning: 'Streamlines inventory management' },
      { equipment: 'Digital Signage', estimatedBudget: '$5K-$18K', potentialDealSize: 11500, reasoning: 'Modern marketing and customer engagement' }
    ],
    'Fitness & Wellness': [
      { equipment: 'Commercial Treadmills', estimatedBudget: '$5K-$15K', potentialDealSize: 10000, reasoning: 'Core cardio equipment for gyms' },
      { equipment: 'Weight Training Equipment', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Essential for strength training programs' },
      { equipment: 'Spa Equipment', estimatedBudget: '$6K-$20K', potentialDealSize: 13000, reasoning: 'Specialized equipment for wellness services' },
      { equipment: 'Audio/Visual Systems', estimatedBudget: '$3K-$10K', potentialDealSize: 6500, reasoning: 'Enhances member experience' },
      { equipment: 'Locker Systems', estimatedBudget: '$4K-$12K', potentialDealSize: 8000, reasoning: 'Essential facility infrastructure' }
    ],
    'Auto Repair & Service': [
      { equipment: 'Diagnostic Equipment', estimatedBudget: '$8K-$25K', potentialDealSize: 16500, reasoning: 'Critical for modern vehicle diagnostics' },
      { equipment: 'Vehicle Lifts & Hoists', estimatedBudget: '$10K-$35K', potentialDealSize: 22500, reasoning: 'Essential for vehicle service access' },
      { equipment: 'Air Compressor Systems', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Powers pneumatic tools and equipment' },
      { equipment: 'Tire Changing Equipment', estimatedBudget: '$5K-$15K', potentialDealSize: 10000, reasoning: 'High-volume service equipment' },
      { equipment: 'Paint Booth Systems', estimatedBudget: '$15K-$40K', potentialDealSize: 27500, reasoning: 'Premium service capability equipment' }
    ],
    'Professional Services': [
      { equipment: 'Office Technology', estimatedBudget: '$3K-$12K', potentialDealSize: 7500, reasoning: 'Essential for modern office operations' },
      { equipment: 'Conference Room Equipment', estimatedBudget: '$5K-$18K', potentialDealSize: 11500, reasoning: 'Professional client presentation needs' },
      { equipment: 'Security Systems', estimatedBudget: '$4K-$15K', potentialDealSize: 9500, reasoning: 'Protects confidential client information' },
      { equipment: 'Document Management', estimatedBudget: '$2K-$8K', potentialDealSize: 5000, reasoning: 'Improves efficiency and compliance' },
      { equipment: 'Communication Systems', estimatedBudget: '$3K-$10K', potentialDealSize: 6500, reasoning: 'Essential for client communication' }
    ]
  };

  private async enrichWithMockData(domain: string): Promise<any> {
    const enrichedProspects = [];
    
    for (const prospect of prospects) {
      try {
        // Add mock enriched data temporarily
        const enrichedData = await this.enrichWithMockData(prospect.website || '')
        
        const enrichedProspect = {
          ...prospect,
          ...enrichedData,
          microTicketScore: this.calculateMicroTicketScore(enrichedData),
          industry: this.identifyIndustry(prospect.name, prospect.types || [])
        };
        
        enrichedProspects.push(enrichedProspect);
      } catch (error) {
        console.error('Error enriching prospect:', error);
        // Return original prospect if enrichment fails
        enrichedProspects.push({
          ...prospect,
          microTicketScore: 0,
          industry: industry
        });
      }
    }
    
    return enrichedProspects;
  }

  private async enrichWithMockData(businessName: string, domain: string, businessLocation: string): Promise<any> {
    // Temporary mock data to get the app working
    const mockEmployeeCount = Math.floor(Math.random() * 50) + 5;
    const mockRevenue = ['$100K - $500K', '$500K - $1M', '$1M - $5M'][Math.floor(Math.random() * 3)];
    
    return {
      employeeCount: mockEmployeeCount,
      revenue: mockRevenue,
      estimatedAnnualRevenue: mockEmployeeCount * 75000,
      employeeRange: mockEmployeeCount < 10 ? '1-10' : mockEmployeeCount < 25 ? '11-25' : '26-50',
      industry: 'Service Business',
      contacts: [
        {
          name: 'Business Owner',
          title: 'Owner/Manager',
          email: domain ? `contact@${domain.replace('https://', '').replace('http://', '')}` : null,
          phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        }
      ]
    };
  }

  private identifyIndustry(businessName: string, googleTypes: string[]): string {
    const name = businessName.toLowerCase();
    const types = googleTypes.join(' ').toLowerCase();
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      for (const keyword of keywords) {
        if (name.includes(keyword) || types.includes(keyword)) {
          return industry;
        }
      }
    }
    
    return 'General Business';
  }

  getEquipmentSuggestions(industry: string): string[] {
    const suggestions = this.equipmentByIndustry[industry] || this.equipmentByIndustry['Professional Services'] || [];
    return suggestions.slice(0, 3).map(item => item.equipment);
  }

  private calculateMicroTicketScore(enrichedData: any): number {
    let score = 0;
    
    // Employee count scoring (more employees = higher potential)
    const employeeCount = enrichedData.employeeCount || 0;
    if (employeeCount >= 10) score += 3;
    else if (employeeCount >= 5) score += 2;
    else if (employeeCount >= 1) score += 1;
    
    // Revenue scoring
    if (enrichedData.estimatedAnnualRevenue) {
      if (enrichedData.estimatedAnnualRevenue >= 1000000) score += 3;
      else if (enrichedData.estimatedAnnualRevenue >= 500000) score += 2;
      else if (enrichedData.estimatedAnnualRevenue >= 100000) score += 1;
    }
    
    // Contact availability
    if (enrichedData.contacts && enrichedData.contacts.length > 0) {
      score += 2;
      if (enrichedData.contacts[0].email) score += 1;
      if (enrichedData.contacts[0].phone) score += 1;
    }
    
    return Math.min(score, 10); // Cap at 10
  }
}

export default new BusinessEnricher();