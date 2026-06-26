// Minimal ambient typings for the subset of the Google Maps JavaScript API used
// by the customer heat-map page. The full @types/google.maps package is large
// and we only touch a handful of surfaces, so we hand-declare just those here.
//
// Note: there is intentionally no `visualization.HeatmapLayer` here. Google
// removed that layer in Maps JS v3.65, so the customer map renders its own
// heatmap via OverlayView (see src/helpers/heatmapOverlay.ts).
declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number): void;
    getBounds(): LatLngBounds | undefined;
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
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }

  interface Point {
    x: number;
    y: number;
  }

  interface MapPanes {
    overlayLayer: HTMLElement;
    overlayMouseTarget: HTMLElement;
    floatPane: HTMLElement;
    mapPane: HTMLElement;
    markerLayer: HTMLElement;
  }

  interface MapCanvasProjection {
    fromLatLngToDivPixel(latLng: LatLng): Point | null;
  }

  // Base class for custom overlays. Subclasses override onAdd/onRemove/draw and
  // are attached to a map via setMap. Only available after the Maps script loads.
  class OverlayView {
    setMap(map: Map | null): void;
    getMap(): Map | null | undefined;
    getPanes(): MapPanes | null;
    getProjection(): MapCanvasProjection | null;
    onAdd(): void;
    onRemove(): void;
    draw(): void;
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
}

interface Window {
  google?: typeof google;
}
