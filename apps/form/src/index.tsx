import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

document.body.innerHTML = '<div id="app"></div>';

const appContainer = document.getElementById('app');

if (appContainer) {
  const root = createRoot(appContainer);
  root.render(<App />);
}
