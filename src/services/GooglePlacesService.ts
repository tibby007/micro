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
  url?: string;
  enrichmentError?: string;
  industry?: string;
}

class GooglePlacesService {
  private isScriptLoading: boolean = false;
  private scriptLoadPromise: Promise<boolean> | null = null;

  private async loadGoogleMapsScript(): Promise<boolean> {
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.Map &&
      window.google.maps.places &&
      window.google.maps.places.PlacesService
    ) {
      return true;
    }

    if (this.isScriptLoading && this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.isScriptLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) throw new Error('Google Maps API Key is not configured.');

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-places-script')) {
        let attempts = 0;
        const maxAttempts = 50;
        const intervalId = setInterval(() => {
          attempts++;
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.Map &&
            window.google.maps.places &&
            window.google.maps.places.PlacesService
          ) {
            clearInterval(intervalId);
            this.isScriptLoading = false;
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            this.isScriptLoading = false;
            this.scriptLoadPromise = null;
            reject(new Error('Timeout waiting for Google Maps API to fully initialize.'));
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,maps&loading=async&callback=googleMapsApiInitializedCallback`;

      (window as any).googleMapsApiInitializedCallback = () => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.Map &&
          window.google.maps.places &&
          window.google.maps.places.PlacesService
        ) {
          this.isScriptLoading = false;
          resolve(true);
        } else {
          this.isScriptLoading = false;
          this.scriptLoadPromise = null;
          reject(new Error('Google Maps API initialized but Map or PlacesService is missing.'));
        }
        if ((window as any).googleMapsApiInitializedCallback) {
          delete (window as any).googleMapsApiInitializedCallback;
        }
      };

      script.onerror = () => {
        if (document.head && document.head.contains(script)) {
          document.head.removeChild(script);
        }
        if ((window as any).googleMapsApiInitializedCallback) {
          delete (window as any).googleMapsApiInitializedCallback;
        }
        this.isScriptLoading = false;
        this.scriptLoadPromise = null;
        reject(new Error('Failed to load Google Maps script.'));
      };

      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Partial<Business>[]> {
    if (useMockData) {
      return [
        { id: 'mockPlaceId1', name: `Mock ${industry} A in ${city}`, address: `123 Mock St, ${city}`, phone: '(555) 000-0001', rating: 4.0 },
        { id: 'mockPlaceId2', name: `Mock ${industry} B in ${city}`, address: `456 Fake Ave, ${city}`, phone: '(555) 000-0002', rating: 3.5 }
      ];
    }

    await this.loadGoogleMapsScript();

    if (
      !(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)
    ) {
      throw new Error('Google Maps API not loaded.');
    }

    const mapDiv = document.createElement('div');
    const map = new window.google.maps.Map(mapDiv);
    const service = new window.google.maps.places.PlacesService(map);

    const request: google.maps.places.TextSearchRequest = {
      query: `${industry} in ${city}`,
    };

    return new Promise<Partial<Business>[]>((resolve, reject) => {
      service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const businesses: Partial<Business>[] = results
            .filter(place => place.place_id)
            .map((place: google.maps.places.PlaceResult) => ({
              id: place.place_id!,
              name: place.name || 'Unknown Name',
              address: place.formatted_address || place.vicinity || 'Address not available',
              rating: place.rating || 0,
              types: place.types || [],
              phone: place.formatted_phone_number || undefined,
              website: place.website || undefined,
              url: place.url || undefined,
            }));
          resolve(businesses);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places textSearch failed: ${status}`));
        }
      });
    });
  }

  async getBusinessDetails(placeId: string): Promise<Partial<Business>> {
    if (!placeId) return {};

    await this.loadGoogleMapsScript();

    if (
      !(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)
    ) {
      return { id: placeId, name: "Details Error", enrichmentError: "Google Maps API not loaded." };
    }

    const mapDiv = document.createElement('div');
    const map = new window.google.maps.Map(mapDiv);
    const service = new window.google.maps.places.PlacesService(map);

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: placeId,
      fields: [
        'place_id',
        'name',
        'website',
        'formatted_phone_number',
        'international_phone_number',
        'formatted_address',
        'vicinity',
        'rating',
        'types',
        'url',
        'business_status'
      ]
    };

    return new Promise<Partial<Business>>((resolve) => {
      service.getDetails(request, (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const details: Partial<Business> = {
            id: place.place_id!,
            name: place.name || undefined,
            address: place.formatted_address || place.vicinity || undefined,
            phone: place.formatted_phone_number || place.international_phone_number || undefined,
            rating: place.rating || 0,
            website: place.website || undefined,
            types: place.types || [],
            url: place.url || undefined,
          };
          resolve(details);
        } else {
          resolve({
            id: placeId,
            name: "Details Unavailable",
            enrichmentError: `Details fetch failed with status: ${status}`
          });
        }
      });
    });
  }
}

export default new GooglePlacesService();
