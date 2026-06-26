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

  // Load the Maps script and create the map once.
  React.useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: 30, lng: 10 },
          zoom: 2,
          minZoom: 2,
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

  // Geocode customer addresses and (re)draw the heat-map layer whenever the map
  // is ready or the customer list changes.
  React.useEffect(() => {
    if (mapsStatus !== 'ready' || !window.google?.maps || !mapRef.current) return;

    let cancelled = false;
    const maps = window.google.maps;

    const run = async () => {
      // Unique, non-empty addresses - geocoding the same city once is enough.
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
          // Network error / over-query-limit: record nothing (leave uncached so
          // it's retried next visit) but keep going for the rest.
          cache[key] = cache[key] ?? null;
        }
        setProgress({ done: i + 1, total: pending.length });
        // Stay well under Google's geocoding QPS limits.
        await sleep(120);
      }

      if (cancelled) return;
      saveGeocodeCache(cache);
      setProgress(null);

      // Build one point per customer (so a city's intensity scales with how many
      // customers live there), then collapse identical coordinates into weights.
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

      const bounds = new maps.LatLngBounds();
      const data = weighted.map((point) => {
        const latLng = new maps.LatLng(point.lat, point.lng);
        bounds.extend(latLng);
        return { location: latLng, weight: point.weight };
      });

      heatmapRef.current = new maps.visualization.HeatmapLayer({
        data,
        map: mapRef.current ?? undefined,
        radius: 28,
        opacity: 0.7,
        dissipating: true,
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
      <PageHeader icon={<MapIcon className="size-5" />} title="Customer map">
        {mapsStatus === 'ready' && progress === null && pointCount > 0 && (
          <span className="text-sm text-base-content/60">
            {pointCount} location{pointCount === 1 ? '' : 's'}
          </span>
        )}
      </PageHeader>

      <p className="text-sm text-base-content/60 -mt-2">
        A heat map of where your customers come from, based on their saved addresses.
      </p>

      <div className="relative w-full h-[calc(100dvh-12rem)] min-h-80 rounded-lg overflow-hidden border border-base-300 bg-base-200">
        <div ref={containerRef} className="absolute inset-0" />

        {mapsStatus === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-200/80">
            <Spinner className="size-6" />
          </div>
        )}

        {mapsStatus === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-base-content/70">
              The map could not be loaded. Check the network connection and that the Google Maps API
              key is valid.
            </p>
          </div>
        )}

        {mapsStatus === 'no-key' && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-md text-center text-sm text-base-content/70 flex flex-col gap-2">
              <p className="font-medium text-base-content">No Google Maps API key configured</p>
              <p>
                Set <code className="px-1 rounded bg-base-300">GOOGLE_MAPS_API_KEY</code> in{' '}
                <code className="px-1 rounded bg-base-300">
                  packages/constants/src/GOOGLE_MAPS_API_KEY.ts
                </code>{' '}
                to a key with the Maps JavaScript API and Geocoding API enabled.
              </p>
            </div>
          </div>
        )}

        {progress !== null && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md bg-base-100/90 px-3 py-1.5 shadow text-sm">
            <Spinner className="size-4" />
            <span>
              Locating customers… {progress.done} / {progress.total}
            </span>
          </div>
        )}

        {mapsStatus === 'ready' && progress === null && pointCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none">
            <p className="text-sm text-base-content/70">
              No customer addresses to map yet. Add addresses to customers to populate the heat map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
