// Browser key for the Google Maps JavaScript API, used by the PMS customer
// heat-map page. Like the Firebase config, a Maps JS API key is not a secret -
// it ships in the client bundle and is meant to be locked down by HTTP-referrer
// restrictions in the Google Cloud console (APIs & Services > Credentials), so
// it is safe to commit.
//
// The key needs the "Maps JavaScript API" and "Geocoding API" enabled.
//
// Leave it empty to disable the map: the heat-map page then renders setup
// instructions instead of trying (and failing) to load Google Maps.
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDb5EmMavpZbWl8sZwGjUXUcBmyv3G9jW8';
