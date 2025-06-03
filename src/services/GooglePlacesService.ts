// src/services/GooglePlacesService.ts

// ... (keep existing global interface and Business interface) ...

class GooglePlacesService {
  private isScriptLoading: boolean = false;
  private scriptLoadPromise: Promise<boolean> | null = null;

  private async loadGoogleMapsScript(): Promise<boolean> {
    // Check if core 'Map' and 'places.PlacesService' are already available
    if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
      console.log('✅ Google Maps & Places API already fully available.');
      return true;
    }

    if (this.isScriptLoading && this.scriptLoadPromise) {
      console.log('🔁 Google Maps script is already in the process of loading/initializing. Awaiting completion...');
      return this.scriptLoadPromise;
    }

    this.isScriptLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY; // Using the corrected variable name

    if (!apiKey) {
      console.error('❌ VITE_GOOGLE_PLACES_API_KEY is not set in environment variables!');
      this.isScriptLoading = false;
      throw new Error('Google Maps API Key is not configured.');
    }
    console.log('🔑 Using Google Maps API Key for script load.');

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-places-script')) {
        console.warn('🔁 Script tag #google-maps-places-script already exists. Waiting for full API availability...');
        // If tag exists, poll for full API availability
        let attempts = 0;
        const maxAttempts = 50; // Poll for 5 seconds (50 * 100ms)
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
      // Ensure libraries=places,maps is present
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,maps&loading=async&callback=googleMapsInitialized`;
      
      // Define a global callback function that the Maps API will call
      (window as any).googleMapsInitialized = () => {
        console.log('✅ Google Maps script & libraries initialized (via callback).');
        // Double check critical components
        if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService) {
            this.isScriptLoading = false;
            resolve(true);
        } else {
            console.error('❌ Google Maps callback fired, but critical components still missing.');
            this.isScriptLoading = false;
            this.scriptLoadPromise = null; // Reset for potential retry
            reject(new Error('Google Maps API initialized but Map or PlacesService is missing.'));
        }
        // Clean up the global callback
        delete (window as any).googleMapsInitialized;
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script (onerror event):', error);
        if(document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete (window as any).googleMapsInitialized; // Clean up callback on error too
        this.isScriptLoading = false;
        this.scriptLoadPromise = null;
        reject(new Error('Failed to load Google Maps script. Check network and API key restrictions.'));
      };
      document.head.appendChild(script);
    });
    return this.scriptLoadPromise;
  }

  // ... rest of your GooglePlacesService.ts (searchBusinesses method) ...
  async searchBusinesses(city: string, industry: string, useMockData = false): Promise<Business[]> {
    // ... (no changes to the start of this method) ...

    try {
      await this.loadGoogleMapsScript(); // Ensure script is loaded AND INITIALIZED

      // It's good to add an explicit check here before using the API
      if (!(window.google && window.google.maps && window.google.maps.Map && window.google.maps.places && window.google.maps.places.PlacesService)) {
        console.error("❌ Critical Google Maps API components not available after load attempt.");
        throw new Error("Google Maps API components not ready.");
      }

      const mapDiv = document.createElement('div');
      // THE PROBLEMATIC LINE:
      const map = new window.google.maps.Map(mapDiv); 
      const service = new window.google.maps.places.PlacesService(map);

      // ... (rest of searchBusinesses method) ...
    } catch (error) {
      console.error('💥 GooglePlacesService: Error in searchBusinesses:', error);
      throw error;
    }
  }
}

export default new GooglePlacesService();