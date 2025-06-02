

export interface Prospect {
    id?: string;
    name: string;
    address: string;
    type: string;
    industry?: string;
    phone?: string;
    website?: string;
    rating?: number;
    email?: string;
    employeeCount?: string;
    decisionMaker?: string;
    priority?: string;
  }

// Define a type for the equipment types mapping
export type EquipmentTypeMap = {
    [industry: string]: string[];
};

// Define a type for industry to Google Place type mapping
export type IndustryToPlaceTypeMap = {
    [industry: string]: string;
};

// Added: Augment the global Window interface for TypeScript
// This helps TypeScript understand the structure of window.process.env
// used in App.tsx for accessing environment variables injected via index.html.
declare global {
    interface Window {
        process?: {
            env?: {
                REACT_APP_GOOGLE_PLACES_API_KEY?: string;
                // Add other expected env vars here if needed
            };
        };
    }
}
