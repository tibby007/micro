// src/services/GooglePlacesService.ts

declare global {
  interface Window {
    google?: any; 
  }
}

// This Business interface needs to be defined here or imported
export interface Business {
  id: string; 
  name: string;
  address: string; 
  phone?: string; 
  rating: number;
  website?: string;
  types?: string[];
}

class GooglePlacesService {
  private isScriptLoading: boolean = false;
  private scriptLoadPromise: Promise<boolean> | null = null;

  private async loadGoogleMapsScript(): Promise<boolean> {
    if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
      console.log('✅ Google Maps & Places API already fully available.');
      return true;
    }

    if (this.isScriptLoading && this.scriptLoadPromise) {
      console.log('🔁 Google Maps script is already in the process of loading/initializing. Awaiting completion...');
      return this.scriptLoadPromise;
    }

    this.isScriptLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY; 

    if (!apiKey) {
      console.error('❌ VITE_GOOGLE_PLACES_API_KEY is not set in environment variables!');
      this.isScriptLoading = false;
      throw new Error('Google Maps API Key is not configured.');
    }
    console.log('🔑 Using Google Maps API Key for script load.');

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-places-script')) {
        console.warn('🔁 Script tag #google-maps-places-script already exists. Waiting for full API availability...');
        let attempts = 0;
        const maxAttempts = 50; 
        const intervalId = setInterval(() => {
          attempts++;
          if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
            clearInterval(intervalId);
            console.log('✅ Google Maps & Places API became available after script tag was found.');
            this.isScriptLoading = false;
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.error('❌ Timeout: Google Maps & Places API did not become fully available after script tag was found.');
            this.isScriptLoading = false;
            this.scriptLoadPromise = null;
            reject(new Error('Timeout waiting for Google Maps API to fully initialize.'));
          }
        }, 100);
        return;
      }

      console.log('📥 Loading Google Maps script with libraries: places,maps...');
      const script = document.createElement('script');
      script.id = 'google-maps-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,maps&loading=async&callback=googleMapsInitialized`;
      
      (window as any).googleMapsInitialized = () => {
        console.log('✅ Google Maps script & libraries initialized (via callback).');
        if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
            this.isScriptLoading = false;
            resolve(true);
        } else {
            console.error('❌ Google Maps callback fired, but critical components still missing.');
            this.isScriptLoading = false;
            this.scriptLoadPromise = null; 
            reject(new Error('Google Maps API initialized but Map or PlacesService is missing.'));
        }
        delete (window as any).googleMapsInitialized;
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script (onerror event):', error);
        if(document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete (window as any).googleMapsInitialized; 
        this.isScriptLoading = false;
        this.scriptLoadPromise = null;
        reject(new Error('Failed to load Google Maps script. Check network and API key restrictions.'));
      };
      document.head.appendChild(script);
    });
    return this.scriptLoadPromise;
  }

  // THIS IS THE METHOD THAT WAS CAUSING ERRORS
  async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Business[]> {
    console.log('🔍 GooglePlacesService: searchBusinesses called with:', { city, industry, useMockData });

    // This 'if' block uses the useMockData, city, and industry parameters.
    if (useMockData) {
      console.log('📦 GooglePlacesService: Returning mock data for', city, industry);
      // Ensure mock data matches the Business interface
      const mockBusinesses: Business[] = [
        { id: 'mock1', name: `Mock ${industry} A in ${city}`, address: `123 Mock St, ${city}`, phone: '(555) 000-0001', rating: 4.0, website: `https://mock${industry.toLowerCase().replace(/\s+/g, '')}A.com`, types: [industry.toLowerCase().replace(/\s+/g, '_')] },
        { id: 'mock2', name: `Mock ${industry} B in ${city}`, address: `456 Fake Ave, ${city}`, phone: '(555) 000-0002', rating: 3.5, website: `https://mock${industry.toLowerCase().replace(/\s+/g, '')}B.com`, types: [industry.toLowerCase().replace(/\s+/g, '_')] },
      ];
      return mockBusinesses; // This returns a value
    }

    // This 'try' block uses city and industry for the real API call.
    try {
      await this.loadGoogleMapsScript(); 

      if (!(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)) {
        console.error("❌ Critical Google Maps API components not available after load attempt.");
        throw new Error("Google Maps API components not ready.");
      }

      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv); 
      const service = new window.google.maps.places.PlacesService(map);

      const request = {
        query: `${industry} in ${city}`, // city and industry used here
      };

      console.log('🔎 GooglePlacesService: Searching with request:', request);

      return new Promise<Business[]>((resolve, reject) => { // This ensures a Promise<Business[]> is returned
        service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          console.log('📍 GooglePlacesService: Places API Status:', status);
          if (results) {
            console.log('📍 GooglePlacesService: Number of raw results:', results.length);
          }

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const businesses: Business[] = results.map((place: google.maps.places.PlaceResult) => ({
              id: place.place_id || `no-id-${Math.random()}`, 
              name: place.name || 'Unknown Name',
              address: place.formatted_address || place.vicinity || 'Address not available',
              phone: place.formatted_phone_number || undefined, 
              rating: place.rating || 0,
              website: place.website || undefined, 
              types: place.types || [],
            }));
            console.log('✅ GooglePlacesService: Returning', businesses.length, 'real businesses.');
            resolve(businesses);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log('ℹ️ GooglePlacesService: Zero results found for the query.');
            resolve([]); 
          } else {
            console.error('❌ GooglePlacesService: Places search failed with status:', status);
            reject(new Error(`Places search failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('💥 GooglePlacesService: Error in searchBusinesses:', error);
      throw error; // This ensures a Promise rejection is propagated, satisfying return type
    }
  }
}

export default new GooglePlacesService();