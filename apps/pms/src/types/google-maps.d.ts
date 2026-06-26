// Minimal ambient typings for the subset of the Google Maps JavaScript API
// (plus the `visualization` library) used by the customer heat-map page. The
// full @types/google.maps package is large and we only touch a handful of
// surfaces, so we hand-declare just those here.
declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number): void;
  }

  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    minZoom?: number;
    mapTypeId?: string;
    streetViewControl?: boolean;
    mapTypeControl?: boolean;
    fullscreenControl?: boolean;
    gestureHandling?: string;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class LatLngBounds {
    extend(point: LatLng | LatLngLiteral): void;
    isEmpty(): boolean;
  }

  class Geocoder {
    geocode(request: { address: string }): Promise<GeocoderResponse>;
  }

  interface GeocoderResponse {
    results: GeocoderResult[];
  }

  interface GeocoderResult {
    geometry: { location: LatLng };
  }

  namespace visualization {
    class HeatmapLayer {
      constructor(options?: HeatmapLayerOptions);
      setMap(map: Map | null): void;
      setData(data: WeightedLocation[] | LatLng[]): void;
    }

    interface HeatmapLayerOptions {
      data?: WeightedLocation[] | LatLng[];
      map?: Map;
      radius?: number;
      opacity?: number;
      dissipating?: boolean;
      maxIntensity?: number;
    }

    interface WeightedLocation {
      location: LatLng;
      weight: number;
    }
  }
}

interface Window {
  google?: typeof google;
}
