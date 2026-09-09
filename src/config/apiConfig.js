/**
 * API Configuration for Juicee App
 * Automatically detects environment and uses appropriate backend URL
 */

// Detect if running on mobile (Capacitor) or web
const isNative = typeof window !== 'undefined' && window.Capacitor;

// Prioritize environment variable if defined (for local development/custom builds)
// Otherwise fallback to localhost if developing locally, or the active production backend
const PRODUCTION_URL = 'https://juicyapp.in';
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const rawApiUrl = process.env.REACT_APP_API_URL || (isLocalhost ? 'http://localhost:5000' : PRODUCTION_URL);
const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_SERVER_URL || (isLocalhost ? 'http://localhost:5000' : PRODUCTION_URL);
const SOCKET_BASE_URL = rawSocketUrl.endsWith('/') ? rawSocketUrl.slice(0, -1) : rawSocketUrl;

console.log(`🌐 [API Config] Running on: ${isNative ? 'MOBILE' : 'WEB'}`);
console.log(`📡 [API Config] Backend URL: ${API_BASE_URL}`);
console.log(`🔌 [API Config] Socket URL: ${SOCKET_BASE_URL}`);

// Help developer notice if they forgot to change localhost in Android build
if (isNative && API_BASE_URL.includes('localhost')) {
  console.warn("⚠️ [API Config] WARNING: API_BASE_URL is pointing to localhost on a mobile device! If you are running the backend on your computer, use your computer's local IP address (e.g. http://192.168.x.x:5000) or http://10.0.2.2:5000 (for emulator) instead of localhost.");
}

export { API_BASE_URL, SOCKET_BASE_URL };
export default API_BASE_URL;
