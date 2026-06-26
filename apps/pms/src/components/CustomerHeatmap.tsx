import * as React from 'react';
import { Map as MapIcon } from 'lucide-react';
import { PageHeader, Spinner } from '@trinserhof/ui';
import useCustomers from 'src/hooks/useCustomers';
import { loadGoogleMaps, MISSING_API_KEY } from 'src/helpers/loadGoogleMaps';
import {
  addressCacheKey,
  buildAddress,
  loadGeocodeCache,
  saveGeocodeCache,
  toWeightedPoints,
  type GeocodeCache,
  type LatLng,
} from 'src/helpers/customerGeocoding';

type MapsStatus = 'loading' | 'ready' | 'no-key' | 'error';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const CustomerHeatmap = () => {
  const customers = useCustomers();

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const heatmapRef = React.useRef<google.maps.visualization.HeatmapLayer | null>(null);

  const [mapsStatus, setMapsStatus] = React.useState<MapsStatus>('loading');
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [pointCount, setPointCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: 47.0, lng: 11.0 }, // Centered roughly on Austria/Tyrol
          zoom: 5,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });
        setMapsStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMapsStatus(
          error instanceof Error && error.message === MISSING_API_KEY ? 'no-key' : 'error',
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (mapsStatus !== 'ready' || !window.google?.maps || !mapRef.current) return;

    let cancelled = false;
    const maps = window.google.maps;

    const run = async () => {
      const customerAddresses = customers
        .map((customer) => buildAddress(customer))
        .filter((address) => address.length > 0);
      const uniqueAddresses = Array.from(new Set(customerAddresses.map(addressCacheKey)));

      const cache: GeocodeCache = loadGeocodeCache();
      const geocoder = new maps.Geocoder();
      const pending = uniqueAddresses.filter((key) => !(key in cache));

      if (pending.length > 0) {
        setProgress({ done: 0, total: pending.length });
      }

      for (let i = 0; i < pending.length; i += 1) {
        if (cancelled) return;
        const key = pending[i];
        try {
          const response = await geocoder.geocode({ address: key });
          const location = response.results[0]?.geometry.location;
          cache[key] = location ? { lat: location.lat(), lng: location.lng() } : null;
        } catch {
          cache[key] = cache[key] ?? null;
        }
        setProgress({ done: i + 1, total: pending.length });
        await sleep(120);
      }

      if (cancelled) return;
      saveGeocodeCache(cache);
      setProgress(null);

      const points: LatLng[] = customerAddresses
        .map((address) => cache[addressCacheKey(address)])
        .filter((value): value is LatLng => value != null);
      
      const weighted = toWeightedPoints(points);
      setPointCount(weighted.length);

      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }

      if (weighted.length === 0) return;

      if (!maps.visualization) {
        console.error('Heatmap visualization library missing.');
        return;
      }

      const bounds = new maps.LatLngBounds();
      const data = weighted.map((point) => {
        const latLng = new maps.LatLng(point.lat, point.lng);
        bounds.extend(latLng);
        return { location: latLng, weight: point.weight ?? 1 };
      });

      // DEBUG LOGS
      console.log('Heatmap Data Array:', data);
      console.log('Bounds:', bounds.getCenter().toString());

      heatmapRef.current = new maps.visualization.HeatmapLayer({
        data,
        map: mapRef.current,
        radius: 28,
        opacity: 0.8,
        dissipating: true,
        maxIntensity: 10,
      });

      if (!bounds.isEmpty() && mapRef.current) {
        mapRef.current.fitBounds(bounds, 48);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [customers, mapsStatus]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl px-4 py-6">
      <PageHeader icon={<MapIcon className="size-5" />} title="Customer map" />
      
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-base-300 bg-base-200">
        <div ref={containerRef} className="absolute inset-0" />
        
        {mapsStatus === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div>}
        
        {progress !== null && (
          <div className="absolute top-4 left-4 bg-white/90 p-2 rounded shadow text-sm">
            Geocoding: {progress.done}/{progress.total}
          </div>
        )}
      </div>
    </div>
  );
};
