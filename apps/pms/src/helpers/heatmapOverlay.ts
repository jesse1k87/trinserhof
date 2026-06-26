import { type LatLng } from './customerGeocoding';

export type WeightedLatLng = LatLng & { weight: number };

export interface HeatmapOverlay {
  // Replace the rendered points and redraw.
  setData(points: WeightedLatLng[]): void;
  // Attach to (or detach with `null`) a map, mirroring the old HeatmapLayer API.
  setMap(map: google.maps.Map | null): void;
}

export interface HeatmapOverlayOptions {
  // Blob radius in pixels.
  radius?: number;
  // Overall opacity of the colorized layer (0-1).
  opacity?: number;
}

// Builds a 256-entry blue -> cyan -> green -> yellow -> red color ramp, indexed
// by accumulated intensity (0-255). Returned as raw RGBA bytes so the hot path
// can look colors up without re-running gradient math per pixel.
const buildColorRamp = (): Uint8ClampedArray => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0.0, 'rgba(0, 0, 255, 0)');
  gradient.addColorStop(0.2, 'rgb(0, 0, 255)');
  gradient.addColorStop(0.4, 'rgb(0, 255, 255)');
  gradient.addColorStop(0.6, 'rgb(0, 255, 0)');
  gradient.addColorStop(0.8, 'rgb(255, 255, 0)');
  gradient.addColorStop(1.0, 'rgb(255, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return ctx.getImageData(0, 0, 256, 1).data;
};

// A self-contained heatmap rendered onto a canvas overlay. This replaces
// google.maps.visualization.HeatmapLayer, which was removed from the Maps
// JavaScript API in v3.65 (see https://developers.google.com/maps/deprecations).
//
// google.maps.OverlayView is a runtime class that only exists once the Maps
// script has loaded, so the overlay subclass is defined inside this factory
// (which receives the loaded `google.maps` namespace) rather than at module top
// level.
export const createHeatmapOverlay = (
  maps: typeof google.maps,
  options?: HeatmapOverlayOptions,
): HeatmapOverlay => {
  const radius = options?.radius ?? 28;
  const opacity = options?.opacity ?? 0.8;
  const colorRamp = buildColorRamp();

  class CanvasHeatmap extends maps.OverlayView {
    private canvas: HTMLCanvasElement | null = null;
    private points: WeightedLatLng[] = [];

    setData(points: WeightedLatLng[]): void {
      this.points = points;
      this.draw();
    }

    onAdd(): void {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      this.canvas = canvas;
      this.getPanes()?.overlayLayer.appendChild(canvas);
    }

    onRemove(): void {
      this.canvas?.parentNode?.removeChild(this.canvas);
      this.canvas = null;
    }

    draw(): void {
      const canvas = this.canvas;
      const projection = this.getProjection();
      const map = this.getMap();
      if (!canvas || !projection || !map) return;

      const bounds = map.getBounds();
      if (!bounds) return;

      // Size and position the canvas to cover the current viewport, working in
      // the overlay pane's "div pixel" coordinate space so children align.
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const topRight = projection.fromLatLngToDivPixel(new maps.LatLng(ne.lat(), ne.lng()));
      const bottomLeft = projection.fromLatLngToDivPixel(new maps.LatLng(sw.lat(), sw.lng()));
      if (!topRight || !bottomLeft) return;

      const left = bottomLeft.x;
      const top = topRight.y;
      const width = Math.max(1, Math.round(topRight.x - bottomLeft.x));
      const height = Math.max(1, Math.round(bottomLeft.y - topRight.y));

      canvas.style.left = `${left}px`;
      canvas.style.top = `${top}px`;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      if (this.points.length === 0) return;

      // 1. Accumulate intensity as grayscale alpha. Additive ('lighter')
      //    blending makes overlapping blobs build up into hotter spots.
      ctx.globalCompositeOperation = 'lighter';
      for (const point of this.points) {
        const pixel = projection.fromLatLngToDivPixel(new maps.LatLng(point.lat, point.lng));
        if (!pixel) continue;
        const x = pixel.x - left;
        const y = pixel.y - top;
        if (x < -radius || x > width + radius || y < -radius || y > height + radius) continue;

        // Heavier (more customers at this spot) -> more opaque, so weight feeds
        // into the accumulated intensity that the color ramp reads below.
        const alpha = Math.min(1, 0.5 + 0.1 * ((point.weight ?? 1) - 1));
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      // 2. Colorize: map each pixel's accumulated alpha through the color ramp.
      ctx.globalCompositeOperation = 'source-over';
      const image = ctx.getImageData(0, 0, width, height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const intensity = data[i + 3];
        if (intensity === 0) continue;
        const offset = intensity * 4;
        data[i] = colorRamp[offset];
        data[i + 1] = colorRamp[offset + 1];
        data[i + 2] = colorRamp[offset + 2];
        data[i + 3] = Math.round(intensity * opacity);
      }
      ctx.putImageData(image, 0, 0);
    }
  }

  return new CanvasHeatmap();
};
