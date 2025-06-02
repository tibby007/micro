import axios from 'axios';

interface EquipmentSuggestion {
  equipment: string;
  estimatedBudget: string;
  potentialDealSize: number;
  reasoning: string;
}

interface IndustryKeywords {
  [key: string]: string[];
}

interface Contact {
  name: string;
  title: string;
  email?: string;
  phone?: string;
}

class BusinessEnricher {
  private industryKeywords: IndustryKeywords = {
    'Medical & Healthcare': ['medical', 'healthcare', 'clinic', 'hospital', 'dental', 'veterinary', 'health'],
    'Restaurant': ['restaurant', 'cafe', 'bakery', 'bar', 'food', 'dining', 'kitchen'],
    'Retail': ['store', 'shop', 'retail', 'boutique', 'market', 'mall'],
    'Fitness & Wellness': ['gym', 'fitness', 'yoga', 'pilates', 'wellness', 'spa', 'salon'],
    'Professional Services': ['consulting', 'law', 'accounting', 'insurance', 'real estate'],
    'Technology': ['software', 'tech', 'IT', 'computer', 'digital', 'data'],
    'Education': ['school', 'university', 'college', 'academy', 'training', 'education'],
    'Automotive': ['auto', 'car', 'mechanic', 'tire', 'vehicle', 'automotive'],
    'Construction': ['construction', 'contractor', 'building', 'renovation', 'plumbing', 'electrical'],
    'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial', 'warehouse']
  };

  private equipmentByIndustry: { [key: string]: EquipmentSuggestion[] } = {
    'Medical & Healthcare': [
      { equipment: 'Digital X-Ray System', estimatedBudget: '$75K-$200K', potentialDealSize: 150000, reasoning: 'Essential diagnostic equipment for modern healthcare facilities' },
      { equipment: 'Electronic Health Records (EHR) System', estimatedBudget: '$15K-$70K', potentialDealSize: 45000, reasoning: 'Mandatory for HIPAA compliance and efficient patient management' },
      { equipment: 'Ultrasound Machine', estimatedBudget: '$20K-$100K', potentialDealSize: 60000, reasoning: 'Versatile diagnostic tool for various medical specialties' },
      { equipment: 'Patient Monitoring System', estimatedBudget: '$5K-$25K', potentialDealSize: 15000, reasoning: 'Critical for patient safety and care quality' },
      { equipment: 'Dental Chair & Equipment', estimatedBudget: '$15K-$40K', potentialDealSize: 25000, reasoning: 'Core equipment for dental practices' },
      { equipment: 'Laboratory Equipment', estimatedBudget: '$30K-$150K', potentialDealSize: 90000, reasoning: 'Essential for in-house testing and diagnostics' },
      { equipment: 'Telemedicine Setup', estimatedBudget: '$5K-$20K', potentialDealSize: 12000, reasoning: 'Growing necessity for remote patient care' },
      { equipment: 'Medical Laser Equipment', estimatedBudget: '$30K-$120K', potentialDealSize: 75000, reasoning: 'Advanced treatment option for various procedures' },
      { equipment: 'Autoclave Sterilizer', estimatedBudget: '$3K-$15K', potentialDealSize: 8000, reasoning: 'Mandatory for instrument sterilization' },
      { equipment: 'Practice Management Software', estimatedBudget: '$5K-$30K', potentialDealSize: 15000, reasoning: 'Streamlines operations and improves efficiency' }
    ],
    'Restaurant': [
      { equipment: 'Commercial Kitchen Equipment', estimatedBudget: '$50K-$150K', potentialDealSize: 100000, reasoning: 'Complete kitchen setup or major equipment replacement' },
      { equipment: 'POS System', estimatedBudget: '$3K-$15K', potentialDealSize: 8000, reasoning: 'Modern payment processing and inventory management' },
      { equipment: 'Walk-in Cooler/Freezer', estimatedBudget: '$8K-$30K', potentialDealSize: 20000, reasoning: 'Essential for food storage and safety compliance' },
      { equipment: 'Commercial Range & Oven', estimatedBudget: '$5K-$25K', potentialDealSize: 15000, reasoning: 'Core cooking equipment replacement or upgrade' },
      { equipment: 'Dishwashing System', estimatedBudget: '$5K-$20K', potentialDealSize: 12000, reasoning: 'High-efficiency commercial dishwasher' },
      { equipment: 'Bar Equipment Package', estimatedBudget: '$10K-$40K', potentialDealSize: 25000, reasoning: 'Complete bar setup or renovation' },
      { equipment: 'Espresso Machine & Coffee Station', estimatedBudget: '$5K-$20K', potentialDealSize: 12000, reasoning: 'Premium coffee service equipment' },
      { equipment: 'Food Truck Equipment', estimatedBudget: '$30K-$100K', potentialDealSize: 65000, reasoning: 'Mobile kitchen setup or conversion' },
      { equipment: 'Bakery Oven & Equipment', estimatedBudget: '$20K-$80K', potentialDealSize: 50000, reasoning: 'Specialized baking equipment' },
      { equipment: 'Outdoor Dining Setup', estimatedBudget: '$10K-$50K', potentialDealSize: 30000, reasoning: 'Patio furniture, heaters, and weather protection' }
    ],
    'Technology': [
      { equipment: 'Server Infrastructure', estimatedBudget: '$20K-$100K', potentialDealSize: 60000, reasoning: 'Data center or server room upgrade' },
      { equipment: 'Cybersecurity Suite', estimatedBudget: '$10K-$50K', potentialDealSize: 30000, reasoning: 'Comprehensive security solution implementation' },
      { equipment: 'Workstation Refresh', estimatedBudget: '$30K-$150K', potentialDealSize: 90000, reasoning: 'Company-wide computer and equipment upgrade' },
      { equipment: 'Network Infrastructure', estimatedBudget: '$15K-$75K', potentialDealSize: 45000, reasoning: 'Switches, routers, and wireless systems' },
      { equipment: 'Cloud Migration Services', estimatedBudget: '$20K-$100K', potentialDealSize: 60000, reasoning: 'Infrastructure modernization project' },
      { equipment: 'Video Conferencing System', estimatedBudget: '$5K-$30K', potentialDealSize: 17000, reasoning: 'Professional meeting room setup' },
      { equipment: 'Software Licenses', estimatedBudget: '$10K-$80K', potentialDealSize: 45000, reasoning: 'Enterprise software suite implementation' },
      { equipment: '3D Printing Equipment', estimatedBudget: '$10K-$50K', potentialDealSize: 30000, reasoning: 'Prototyping and production capabilities' },
      { equipment: 'Testing & QA Lab', estimatedBudget: '$15K-$60K', potentialDealSize: 37000, reasoning: 'Quality assurance infrastructure' },
      { equipment: 'Backup & Disaster Recovery', estimatedBudget: '$10K-$50K', potentialDealSize: 30000, reasoning: 'Business continuity solution' }
    ]
  };

  async enrichProspects(prospects: any[], targetIndustry: string): Promise<any[]> {
    console.log(`🔄 Enriching ${prospects.length} prospects with Apollo data...`);
    
    const enrichedProspects = await Promise.all(
      prospects.map(async (prospect) => {
        try {
          console.log(`🔍 Enriching: ${prospect.name}`);
          
          // Extract domain from website or create from name
          let domain = '';
          if (prospect.website) {
            domain = this.extractDomain(prospect.website);
          }
          
          // Get equipment suggestions based on target industry
          const suggestedEquipment = this.getEquipmentSuggestions(targetIndustry);
          
          // Enrich with Apollo data
          const apolloData = await this.enrichWithApollo(
            prospect.name, 
            domain, 
            prospect.vicinity
          );
          
          // Calculate micro ticket score
          const microTicketScore = this.calculateMicroTicketScore(
            apolloData?.employees || 0,
            targetIndustry
          );
          
          return {
            ...prospect,
            targetIndustry,
            suggestedEquipment,
            employees: apolloData?.employees || null,
            employeesRange: apolloData?.employeesRange || null,
            revenue: apolloData?.revenue || null,
            industry: apolloData?.industry || targetIndustry,
            apolloId: apolloData?.id || null,
            contacts: apolloData?.contacts || [],
            microTicketScore,
            enrichedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error(`❌ Error enriching ${prospect.name}:`, error);
          // Return prospect with equipment suggestions even if Apollo fails
          return {
            ...prospect,
            targetIndustry,
            suggestedEquipment: this.getEquipmentSuggestions(targetIndustry),
            microTicketScore: { score: 0, factors: ['Unable to calculate - missing data'] },
            enrichedAt: new Date().toISOString()
          };
        }
      })
    );
    
    return enrichedProspects;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('www.', '').replace(/^https?:\/\//, '');
    }
  }

   getEquipmentSuggestions(industry: string): EquipmentSuggestion[] {
    const suggestions = this.equipmentByIndustry[industry] || [];
    // Return top 3 suggestions with highest potential deal size
    return suggestions
      .sort((a, b) => b.potentialDealSize - a.potentialDealSize)
      .slice(0, 3);
  }

  private async enrichWithApollo(name: string, domain: string, location: string): Promise<any> {
    try {
      // Use your Vercel function instead of direct Apollo API
      const response = await axios.post('/api/apollo', {
        endpoint: 'organizations/search',
        data: {
          q_organization_name: name,
          q_organization_domain: domain,
          q_organization_locations: location,
          page: 1,
          per_page: 1
        }
      }) as any;

      if (response.data.organizations && response.data.organizations.length > 0) {
        const org = response.data.organizations[0];
        
        // Get contacts
        const contacts = await this.getApolloContacts(org.id);
        
        return {
          id: org.id,
          name: org.name,
          domain: org.domain,
          employees: org.estimated_num_employees,
          employeesRange: org.employee_count_range,
          revenue: org.estimated_annual_revenue,
          industry: org.industry,
          contacts
        };
      }
      
      return null;
    } catch (error) {
      console.error('Apollo API error:', error);
      return null;
    }
  }

  private async getApolloContacts(organizationId: string): Promise<Contact[]> {
    try {
      const response = await axios.post('/api/apollo', {
        endpoint: 'people/search',
        data: {
          q_organization_ids: [organizationId],
          contact_email_status: ['verified', 'guessed', 'unavailable'],
          page: 1,
          per_page: 5
        }
      }) as any;

      if (response.data.people) {
        return response.data.people.map((person: any) => ({
          name: person.name,
          title: person.title,
          email: person.email,
          phone: person.phone_numbers?.[0]?.sanitized_number
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  private calculateMicroTicketScore(employees: number, industry: string): any {
    const factors: string[] = [];
    let score = 0;

    // Base score from employee count
    if (employees > 0) {
      if (employees <= 10) {
        score += 4;
        factors.push('Small team (high micro ticket fit)');
      } else if (employees <= 50) {
        score += 3;
        factors.push('Medium team (good micro ticket fit)');
      } else if (employees <= 200) {
        score += 2;
        factors.push('Large team (moderate micro ticket fit)');
      } else {
        score += 1;
        factors.push('Enterprise (lower micro ticket fit)');
      }
    }

    // Industry bonus
    const highMicroTicketIndustries = ['Medical & Healthcare', 'Restaurant', 'Retail', 'Fitness & Wellness'];
    if (highMicroTicketIndustries.includes(industry)) {
      score += 1;
      factors.push(`${industry} typically has frequent equipment needs`);
    }

    return {
      score: Math.min(score, 5), // Cap at 5
      factors
    };
  }

  

  detectIndustry(businessName: string, types: string[]): string {
    const nameAndTypes = `${businessName} ${types.join(' ')}`.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(keyword => nameAndTypes.includes(keyword))) {
        return industry;
      }
    }
    
    return 'Other';
  }
}

export default new BusinessEnricher();