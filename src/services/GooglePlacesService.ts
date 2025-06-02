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
  }
  
  class GooglePlacesService {
    async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Business[]> {
      console.log('🔍 GooglePlacesService called with:', { city, industry, useMockData });
      
      if (useMockData) {
        console.log('📦 Returning mock data');
        // Mock data for testing
        return [
          {
            id: '1',
            name: 'Pizza Palace',
            address: '123 Main St, ' + city,
            phone: '(555) 123-4567',
            rating: 4.5,
            website: 'https://pizzapalace.com'
          },
          {
            id: '2',
            name: 'Burger Barn',
            address: '456 Oak Ave, ' + city,
            phone: '(555) 987-6543',
            rating: 4.2,
            website: 'https://burgerbarn.com'
          }
        ];
      }
  
      console.log('🌐 Using real Google Places API');
      console.log('🔑 API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Key is loaded' : 'NO KEY FOUND!');
  
      try {
        // Initialize Google Places
        if (!window.google) {
          console.log('📥 Loading Google Maps script...');
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCy5jM_SPOe2VtsOnd7OTNQ7GAN1QJSToI&libraries=places`;          script.async = true;
          script.defer = true;
          
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log('✅ Google Maps script loaded');
              resolve(true);
            };
            script.onerror = (error) => {
              console.error('❌ Failed to load Google Maps script:', error);
              reject(error);
            };
          });
        } else {
          console.log('✅ Google Maps already loaded');
        }
  
        // Create a map element (required for PlacesService)
        const map = new window.google.maps.Map(document.createElement('div'));
        const service = new window.google.maps.places.PlacesService(map);
  
        const request = {
          query: `${industry} in ${city}`,
          type: 'establishment'
        };
  
        console.log('🔎 Searching with request:', request);
  
        return new Promise((resolve, reject) => {
          service.textSearch(request, (results: any[], status: any) => {
            console.log('📍 Places API Status:', status);
            console.log('📍 Number of results:', results ? results.length : 0);
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const businesses: Business[] = results.map((place: any) => ({
                id: place.place_id,
                name: place.name,
                address: place.formatted_address || place.vicinity,
                phone: place.formatted_phone_number || '',
                rating: place.rating || 0,
                website: place.website || '',
                types: place.types || []
              }));
              console.log('✅ Returning', businesses.length, 'real businesses');
              resolve(businesses);
            } else {
              console.error('❌ Places search failed with status:', status);
              reject(new Error(`Places search failed: ${status}`));
            }
          });
        });
      } catch (error) {
        console.error('💥 Error in searchBusinesses:', error);
        throw error;
      }
    }
  }
  
  export default new GooglePlacesService();