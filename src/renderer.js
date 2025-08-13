import './index.css';
import App from './app';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';



const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Router>
    <App />
  </Router>
);

console.log('👋 This message is being logged by "renderer.js", included via webpack');
