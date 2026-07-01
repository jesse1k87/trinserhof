import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

// Dev only: esbuild's serve mode emits a "change" event on the /esbuild SSE
// endpoint after every rebuild. Reload the page so the browser picks up the new
// build. LIVE_RELOAD is defined to 'false' for production builds (see
// build.mjs), so this whole block is stripped from the shipped bundle.
if (process.env.LIVE_RELOAD === 'true') {
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

document.body.innerHTML = '<div id="app"></div>';

const appContainer = document.getElementById('app');

if (appContainer) {
  const root = createRoot(appContainer);
  root.render(<App />);
}
