// src/services/GooglePlacesService.ts

declare global {
  interface Window {
    google?: any; // Consider using more specific types if you install @types/google.maps
  }
}

export interface Business {
  id: string; // Corresponds to place_id
  name: string;
  address: string; // Corresponds to formatted_address or vicinity
  phone?: string; // Corresponds to formatted_phone_number
  rating: number;
  website?: string;
  types?: string[];
  // You might want to add other fields that Google Places returns if you need them before enrichment
  // e.g., vicinity, geometry, photos, opening_hours, etc.
  // For BusinessEnricher, 'website' (for domain) and 'types' are important.
}

class GooglePlacesService {
  private isScriptLoading: boolean = false;
  private scriptLoadPromise: Promise<boolean> | null = null;

  private async loadGoogleMapsScript(): Promise<boolean> {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps API already available.');
      return true;
    }

    if (this.isScriptLoading && this.scriptLoadPromise) {
      console.log('🔁 Google Maps script is already in the process of loading. Awaiting completion...');
      return this.scriptLoadPromise;
    }

    this.isScriptLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error('❌ VITE_GOOGLE_PLACES_API_KEY is not set in environment variables!');
      this.isScriptLoading = false; // Reset loading state
      throw new Error('Google Places API Key is not configured.');
    }
    console.log('🔑 Using Google Maps API Key for script load.');

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-places-script')) {
        console.log('🔁 Script tag already exists. Assuming it will load or has loaded.');
        // This might happen if multiple calls happen very quickly.
        // A more robust solution might involve checking window.google in a loop with a timeout.
        // For now, we'll assume if the tag is there, it's being handled.
        // A better check:
        const checkGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                console.log('✅ Google Places API became available after script tag was found.');
                this.isScriptLoading = false;
                resolve(true);
            } else {
                setTimeout(checkGoogle, 100); // Check again shortly
            }
        };
        setTimeout(checkGoogle, 100); // Start checking
        return;
      }

      console.log('📥 Loading Google Places script...');
      const script = document.createElement('script');
      script.id = 'google-maps-places-script'; // Add an ID to prevent multiple appends
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,maps&loading=async`;      // script.async = true; // loading=async in URL is preferred
      // script.defer = true; // Not strictly needed with async and manual promise handling

      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully via onload.');
        this.isScriptLoading = false;
        resolve(true);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Places script:', error);
        document.head.removeChild(script); // Clean up failed script tag
        this.isScriptLoading = false;
        this.scriptLoadPromise = null; // Reset promise so it can be tried again
        reject(new Error('Failed to load Google Maps script.'));
      };
      document.head.appendChild(script);
    });
    return this.scriptLoadPromise;
  }


  async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Business[]> {
    console.log('🔍 GooglePlacesService: searchBusinesses called with:', { city, industry, useMockData });

    if (useMockData) {
      console.log('📦 GooglePlacesService: Returning mock data for', city, industry);
      return [
        { id: 'mock1', name: `Mock ${industry} A in ${city}`, address: `123 Mock St, ${city}`, phone: '(555) 000-0001', rating: 4.0, website: `https://mock${industry.toLowerCase().replace(/\s+/g, '')}A.com`, types: [industry.toLowerCase().replace(/\s+/g, '_')] },
        { id: 'mock2', name: `Mock ${industry} B in ${city}`, address: `456 Fake Ave, ${city}`, phone: '(555) 000-0002', rating: 3.5, website: `https://mock${industry.toLowerCase().replace(/\s+/g, '')}B.com`, types: [industry.toLowerCase().replace(/\s+/g, '_')] },
      ];
    }

    try {
      await this.loadGoogleMapsScript(); // Ensure script is loaded

      // Create a detached DOM element for the map (required by PlacesService but not rendered)
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);

      const request = {
        query: `${industry} in ${city}`,
        // Consider adding more specific fields if needed, though textSearch is broad
        // fields: ['place_id', 'name', 'formatted_address', 'vicinity', 'formatted_phone_number', 'website', 'rating', 'types', 'geometry']
      };

      console.log('🔎 GooglePlacesService: Searching with request:', request);

      return new Promise<Business[]>((resolve, reject) => {
        service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          console.log('📍 GooglePlacesService: Places API Status:', status);
          if (results) {
            console.log('📍 GooglePlacesService: Number of raw results:', results.length);
          }

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const businesses: Business[] = results.map((place: google.maps.places.PlaceResult) => ({
              id: place.place_id || `no-id-${Math.random()}`, // place_id should always be there for OK results
              name: place.name || 'Unknown Name',
              address: place.formatted_address || place.vicinity || 'Address not available',
              phone: place.formatted_phone_number || undefined, // Use undefined if not available
              rating: place.rating || 0,
              website: place.website || undefined, // Use undefined if not available
              types: place.types || [],
            }));
            console.log('✅ GooglePlacesService: Returning', businesses.length, 'real businesses.');
            resolve(businesses);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log('ℹ️ GooglePlacesService: Zero results found for the query.');
            resolve([]); // Resolve with an empty array for zero results
          } else {
            console.error('❌ GooglePlacesService: Places search failed with status:', status);
            reject(new Error(`Places search failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('💥 GooglePlacesService: Error in searchBusinesses:', error);
      // Depending on how you want to handle it, you could return an empty array or re-throw
      // return []; 
      throw error;
    }
  }
}

export default new GooglePlacesService();