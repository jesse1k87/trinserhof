import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './index.css';

document.body.innerHTML = '<div id="app"></div>';

const root = createRoot(document.getElementById('app'));
root.render(<App />);
