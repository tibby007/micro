// src/services/GooglePlacesService.ts

declare global {
  interface Window {
    google?: any; // Consider installing @types/google.maps for better typing
  }
}

export interface Business {
  id: string; // Corresponds to place_id
  name: string;
  address: string; // Corresponds to formatted_address or vicinity
  phone?: string; // Corresponds to formatted_phone_number or international_phone_number
  rating: number;
  website?: string;
  types?: string[];
  url?: string; // Google Maps URL for the place
  enrichmentError?: string;
  industry?: string;
  // Add any other specific fields you want to ensure are on your Business object
}

class GooglePlacesService {
  private isScriptLoading: boolean = false;
  private scriptLoadPromise: Promise<boolean> | null = null;

  private async loadGoogleMapsScript(): Promise<boolean> {
    // Check if core 'Map' and 'places.PlacesService' are already available
    if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
      console.log('✅ GooglePlacesService: Google Maps & Places API already fully available.');
      return true;
    }

    if (this.isScriptLoading && this.scriptLoadPromise) {
      console.log('🔁 GooglePlacesService: Google Maps script is already loading/initializing. Awaiting completion...');
      return this.scriptLoadPromise;
    }

    this.isScriptLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY; // Ensure this matches your .env variable name

    if (!apiKey) {
      console.error('❌ GooglePlacesService: VITE_GOOGLE_PLACES_API_KEY is not set in environment variables!');
      this.isScriptLoading = false;
      // Allow subsequent calls to try again if the key is set later (though unlikely in same session)
      this.scriptLoadPromise = null; 
      throw new Error('Google Maps API Key is not configured.');
    }
    console.log('🔑 GooglePlacesService: Using Google Maps API Key for script load.');

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-places-script')) {
        console.warn('🔁 GooglePlacesService: Script tag #google-maps-places-script already exists. Waiting for full API availability...');
        let attempts = 0;
        const maxAttempts = 50; // Poll for 5 seconds (50 * 100ms)
        const intervalId = setInterval(() => {
          attempts++;
          if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
            clearInterval(intervalId);
            console.log('✅ GooglePlacesService: Google Maps & Places API became available after script tag was found.');
            this.isScriptLoading = false;
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.error('❌ GooglePlacesService: Timeout - Google Maps & Places API did not become fully available after script tag was found.');
            this.isScriptLoading = false;
            this.scriptLoadPromise = null; // Reset promise
            reject(new Error('Timeout waiting for Google Maps API to fully initialize.'));
          }
        }, 100);
        return; // Exit the promise executor, polling will handle resolve/reject
      }

      console.log('📥 GooglePlacesService: Loading Google Maps script with libraries: places,maps...');
      const script = document.createElement('script');
      script.id = 'google-maps-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,maps&loading=async&callback=googleMapsApiInitializedCallback`;
      
      (window as any).googleMapsApiInitializedCallback = () => {
        console.log('✅ GooglePlacesService: Google Maps script & libraries initialized (via global callback).');
        if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
            this.isScriptLoading = false;
            resolve(true);
        } else {
            console.error('❌ GooglePlacesService: Google Maps callback fired, but critical components (Map or PlacesService) still missing.');
            this.isScriptLoading = false;
            this.scriptLoadPromise = null;
            reject(new Error('Google Maps API initialized but Map or PlacesService is missing.'));
        }
        // Clean up the global callback
        if ((window as any).googleMapsApiInitializedCallback) {
            delete (window as any).googleMapsApiInitializedCallback;
        }
      }; 

      script.onerror = (event: Event | string) => { 
        console.error('❌ GooglePlacesService: Failed to load Google Maps script (onerror event):', event);
        if(document.head && document.head.contains(script)) {
          document.head.removeChild(script);
        }
        if ((window as any).googleMapsApiInitializedCallback) {
            delete (window as any).googleMapsApiInitializedCallback;
        }
        this.isScriptLoading = false;
        this.scriptLoadPromise = null;
        reject(new Error('Failed to load Google Maps script. Check network, API key, and key restrictions.'));
      }; 

      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Partial<Business>[]> {
    console.log('🔍 GooglePlacesService: searchBusinesses called with:', { city, industry, useMockData });

    if (useMockData) {
      console.log('📦 GooglePlacesService: Returning mock data for', city, industry);
      return [
        { id: 'mockPlaceId1_for_details_test', name: `Mock ${industry} A in ${city}`, address: `123 Mock St, ${city}`, phone: '(555) 000-0001', rating: 4.0, website: `https://www.example.com/mock${industry.toLowerCase().replace(/\s+/g, '')}A`, types: [industry.toLowerCase().replace(/\s+/g, '_'), 'point_of_interest', 'establishment'] },
        { id: 'mockPlaceId2_for_details_test', name: `Mock ${industry} B in ${city}`, address: `456 Fake Ave, ${city}`, phone: '(555) 000-0002', rating: 3.5, website: `https://www.example.net/mock${industry.toLowerCase().replace(/\s+/g, '')}B`, types: [industry.toLowerCase().replace(/\s+/g, '_'), 'point_of_interest'] },
      ];
    }

    try {
      await this.loadGoogleMapsScript();

      if (!(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)) {
        console.error("❌ GooglePlacesService: Critical Google Maps API components not available before textSearch.");
        throw new Error("Google Maps API components not ready for textSearch.");
      }

      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);

      const request: google.maps.places.TextSearchRequest = {
        query: `${industry} in ${city}`,
        // You could add 'type' here e.g. type: 'restaurant' if industry is 'restaurant'
        // but query is usually sufficient for textSearch.
      };

      console.log('🔎 GooglePlacesService: Searching with textSearch request:', request);

      return new Promise<Partial<Business>[]>((resolve, reject) => {
        service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          console.log('📍 GooglePlacesService: TextSearch API Status:', status);
          if (results) {
            console.log('📍 GooglePlacesService: Number of raw textSearch results:', results.length);
          }

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const businesses: Partial<Business>[] = results
              .filter(place => place.place_id) // Ensure place_id exists
              .map((place: google.maps.places.PlaceResult) => ({
                id: place.place_id!, // Non-null assertion as we filtered
                name: place.name || 'Unknown Name',
                address: place.formatted_address || place.vicinity || 'Address not available',
                rating: place.rating || 0,
                types: place.types || [],
                // These might be undefined from textSearch, Place Details will fetch them reliably
                phone: place.formatted_phone_number || undefined,
                website: place.website || undefined,
                url: place.url || undefined,
              }));
            console.log('✅ GooglePlacesService: TextSearch returning', businesses.length, 'business summaries.');
            resolve(businesses);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log('ℹ️ GooglePlacesService: Zero results found from textSearch.');
            resolve([]);
          } else {
            console.error('❌ GooglePlacesService: TextSearch failed with status:', status);
            reject(new Error(`Places textSearch failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('💥 GooglePlacesService: Error in searchBusinesses:', error);
      throw error;
    }
  }

  async getBusinessDetails(placeId: string): Promise<Partial<Business>> {
    console.log(`🔍 GooglePlacesService: getBusinessDetails called for placeId: ${placeId}`);
    if (!placeId) {
      console.warn("GooglePlacesService: placeId is empty for getBusinessDetails, returning empty object.");
      return {};
    }
  
    try {
      await this.loadGoogleMapsScript();
  
      if (!(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)) {
        console.error("❌ GooglePlacesService: Critical Google Maps API components not available before getBusinessDetails.");
        throw new Error("Google Maps API components not ready for details request.");
      }
  
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);
  
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: ['place_id', 'name', 'website', 'formatted_phone_number', 'international_phone_number', 'formatted_address', 'vicinity', 'rating', 'types', 'url', 'business_status']
      };
  
      console.log('🔎 GooglePlacesService: Requesting Place Details:', request);
  
      return new Promise<Partial<Business>>((resolve, reject) => {
        service.getDetails(request, (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
          console.log(`📍 GooglePlacesService: Place Details API Status for ${placeId}:`, status);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const details: Partial<Business> = {
              id: place.place_id!,
              name: place.name || undefined,
              address: place.formatted_address || place.vicinity || undefined,
              phone: place.formatted_phone_number || place.international_phone_number || undefined,
              rating: place.rating || 0,
              website: place.website || undefined,
              types: place.types || [],
              url: place.url || undefined
            };
            console.log(`✅ GooglePlacesService: Details received for ${place.name || 'placeId ' + placeId}:`, JSON.stringify(details, null, 2));
            resolve(details);
          } else {
            console.error(`❌ GooglePlacesService: Place Details request failed for ${placeId} with status:`, status);
            // FIX: remove reject if unused to avoid TS6133
            resolve({
              id: placeId,
              name: "Details Unavailable",
              enrichmentError: `Details fetch failed with status: ${status}`
            } as Partial<Business>);
          }
        });
      });
  
    } catch (error) {
      console.error(`💥 GooglePlacesService: Error in getBusinessDetails for ${placeId}:`, error);
      return {
        id: placeId,
        name: "Details Error",
        enrichmentError: (error as Error).message
      } as Partial<Business>;
    }
  }
  