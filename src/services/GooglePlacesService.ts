// src/services/GooglePlacesService.ts

declare global {
  interface Window {
    google?: any; 
  }
}

export interface Business {
  id: string; 
  name: string;
  address: string; 
  phone?: string; 
  rating: number;
  website?: string;
  types?: string[];
  url?: string; // Google Maps URL for the place
  // You can add more fields from Place Details if needed by your app directly
  // e.g., international_phone_number, opening_hours, etc.
}

class GooglePlacesService {
  private isScriptLoading: boolean = false;
  private scriptLoadPromise: Promise<boolean> | null = null;

  private async loadGoogleMapsScript(): Promise<boolean> {
    // ... (keep the loadGoogleMapsScript method exactly as it was when it was working)
    // Make sure it loads libraries=places,maps and uses the &callback=googleMapsInitialized
    if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
      console.log('✅ Google Maps & Places API already fully available.');
      return true;
    }
    if (this.isScriptLoading && this.scriptLoadPromise) { /* ... */ return this.scriptLoadPromise; }
    this.isScriptLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) { /* ... throw error ... */ }
    console.log('🔑 Using Google Maps API Key for script load.');
    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-places-script')) { /* ... poll ... */ return; }
      console.log('📥 Loading Google Maps script with libraries: places,maps...');
      const script = document.createElement('script');
      script.id = 'google-maps-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,maps&loading=async&callback=googleMapsInitialized`;
      (window as any).googleMapsInitialized = () => { /* ... resolve(true) or reject ... */ };
      script.onerror = (error) => { /* ... reject ... */ };
      document.head.appendChild(script);
    });
    return this.scriptLoadPromise;
  }

  async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Partial<Business>[]> { // Return Partial<Business> as textSearch gives summary
    console.log('🔍 GooglePlacesService: searchBusinesses called with:', { city, industry, useMockData });
    if (useMockData) {
      // ... (your mock data for searchBusinesses)
      console.log('📦 GooglePlacesService: Returning mock data for', city, industry);
      return [
        { id: 'mock1PlaceId', name: `Mock ${industry} A in ${city}`, address: `123 Mock St, ${city}`, phone: '(555) 000-0001', rating: 4.0, website: `https://mock${industry.toLowerCase().replace(/\s+/g, '')}A.com`, types: [industry.toLowerCase().replace(/\s+/g, '_')] },
        { id: 'mock2PlaceId', name: `Mock ${industry} B in ${city}`, address: `456 Fake Ave, ${city}`, phone: '(555) 000-0002', rating: 3.5, website: `https://mock${industry.toLowerCase().replace(/\s+/g, '')}B.com`, types: [industry.toLowerCase().replace(/\s+/g, '_')] },
      ];
    }
    try {
      await this.loadGoogleMapsScript();
      if (!(/* ... check for google.maps.Map and places.PlacesService ... */)) { throw new Error("Google Maps API components not ready."); }
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv); 
      const service = new window.google.maps.places.PlacesService(map);
      const request = { query: `${industry} in ${city}` };
      console.log('🔎 GooglePlacesService: Searching with request (textSearch):', request);
      return new Promise<Partial<Business>[]>((resolve, reject) => { // Return Partial<Business>
        service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          // ... (map results to Partial<Business>[], only include place_id, name, types, address, rating initially)
          // Crucially, make sure 'id' here is 'place.place_id'
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const businesses: Partial<Business>[] = results.map((place: google.maps.places.PlaceResult) => ({
              id: place.place_id!, // place_id should be present for OK results
              name: place.name || 'Unknown Name',
              address: place.formatted_address || place.vicinity || 'Address not available',
              rating: place.rating || 0,
              types: place.types || [],
              // Initially, phone and website might be sparse from textSearch
              phone: place.formatted_phone_number || undefined,
              website: place.website || undefined 
            }));
            console.log('✅ GooglePlacesService: TextSearch returning', businesses.length, 'summaries.');
            resolve(businesses);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]); 
          } else {
            reject(new Error(`Places textSearch failed: ${status}`));
          }
        });
      });
    } catch (error) { /* ... */ throw error; }
  }

  // ---- NEW METHOD TO ADD ----
  async getBusinessDetails(placeId: string): Promise<Partial<Business>> {
    console.log(`🔍 GooglePlacesService: getBusinessDetails called for placeId: ${placeId}`);
    if (!placeId) {
      console.warn("GooglePlacesService: placeId is empty for getBusinessDetails.");
      return {}; // Or throw an error
    }

    try {
      await this.loadGoogleMapsScript(); // Ensure API is loaded

      if (!(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)) {
        console.error("❌ Critical Google Maps API components not available for getBusinessDetails.");
        throw new Error("Google Maps API components not ready for details request.");
      }

      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);

      const request = {
        placeId: placeId,
        // Explicitly request the fields you absolutely need for enrichment and display
        fields: ['place_id', 'name', 'website', 'formatted_phone_number', 'international_phone_number', 'formatted_address', 'vicinity', 'rating', 'types', 'url', 'business_status']
      };

      console.log('🔎 GooglePlacesService: Requesting Place Details:', request);

      return new Promise<Partial<Business>>((resolve, reject) => {
        service.getDetails(request, (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
          console.log(`📍 GooglePlacesService: Place Details API Status for ${placeId}:`, status);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const details: Partial<Business> = {
              id: place.place_id!, // Should match the input placeId
              name: place.name || undefined,
              address: place.formatted_address || place.vicinity || undefined,
              phone: place.formatted_phone_number || place.international_phone_number || undefined,
              rating: place.rating || 0,
              website: place.website || undefined,
              types: place.types || [],
              url: place.url || undefined, // Google Maps URL for the business
              // business_status: place.business_status, // e.g., "OPERATIONAL"
            };
            console.log(`✅ GooglePlacesService: Details received for ${place.name}:`, details);
            resolve(details);
          } else {
            console.error(`❌ GooglePlacesService: Place Details request failed for ${placeId} with status:`, status);
            // Resolve with an empty object or minimal data if details fail, 
            // so the main loop in BusinessEnricher doesn't break.
            // Or reject(new Error(...)) if you want to handle this failure more explicitly.
            resolve({ id: placeId, name: "Details Fetch Failed" }); 
          }
        });
      });
    } catch (error) {
      console.error(`💥 GooglePlacesService: Error in getBusinessDetails for ${placeId}:`, error);
      throw error; // Or return a default/empty object
    }
  }
  // ---- END OF NEW METHOD ----
}

export default new GooglePlacesService();