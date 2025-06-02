/// <reference types="vite/client" />

declare global {
  interface Window {
    process?: {
      env?: {
        VITE_GOOGLE_PLACES_API_KEY?: string;
        REACT_APP_GOOGLE_PLACES_API_KEY?: string;
      };
    };
  }

  interface ImportMetaEnv {
    readonly VITE_GOOGLE_PLACES_API_KEY: string;
    readonly VITE_APOLLO_API_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module "*.css" {
const content: Record<string, string>;
export default content;
}

export {};