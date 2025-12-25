import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import './index.css';
import App from './App';

const initialOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb', // 'sb' es un fallback para que no crashee si la variable no está
  currency: 'USD',
  intent: 'subscription',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PayPalScriptProvider options={initialOptions}>
      <App />
    </PayPalScriptProvider>
  </StrictMode>
);
