import { GOOGLE_MAPS_API_KEY } from '@trinserhof/constants';

// Thrown when no API key is configured (GOOGLE_MAPS_API_KEY is empty).
export const MISSING_API_KEY = 'MISSING_API_KEY';
// Thrown when the Maps script tag fails to load (bad key, blocked, offline).
export const SCRIPT_LOAD_ERROR = 'SCRIPT_LOAD_ERROR';

// The Maps JS API can only be loaded once per page. Memoize the loader so that
// navigating to the heat-map page repeatedly (or React re-mounting it) reuses
// the single in-flight/settled promise instead of injecting another <script>.
let loaderPromise: Promise<typeof google.maps> | null = null;

export const loadGoogleMaps = (): Promise<typeof google.maps> => {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error(MISSING_API_KEY));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const callbackName = '__onGoogleMapsLoaded';
    const globalScope = window as unknown as Record<string, unknown>;

    globalScope[callbackName] = () => {
      delete globalScope[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        loaderPromise = null;
        reject(new Error(SCRIPT_LOAD_ERROR));
      }
    };

    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      libraries: 'visualization',
      callback: callbackName,
      loading: 'async',
      v: 'weekly',
    });

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      delete globalScope[callbackName];
      loaderPromise = null;
      reject(new Error(SCRIPT_LOAD_ERROR));
    };

    document.head.appendChild(script);
  });

  return loaderPromise;
};
