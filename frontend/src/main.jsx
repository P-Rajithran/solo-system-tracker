import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' && window?.env?.VITE_GOOGLE_CLIENT_ID);
const isConfigured = Boolean(envClientId && !envClientId.includes('sampleclientid') && !envClientId.includes('YOUR_GOOGLE_CLIENT_ID'));

if (typeof window !== 'undefined') {
  window.__IS_GOOGLE_AUTH_CONFIGURED__ = isConfigured;
}

if (!isConfigured) {
  console.warn(
    '[SYSTEM OAUTH WARNING]: VITE_GOOGLE_CLIENT_ID is missing or unconfigured. Set a valid Client ID from your Google Cloud Console in .env to enable official Google OAuth popups.'
  );
}

const GOOGLE_CLIENT_ID = envClientId || '1081234567890-sampleclientid.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
