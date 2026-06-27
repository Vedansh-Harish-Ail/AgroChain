import axios from 'axios';

let serverIpCached = null;

/**
 * Fetches the local network (LAN) IP of the host machine from the backend.
 * Only attempts to fetch if we are running in localhost/development environment.
 * Cache the result to prevent multiple network calls.
 */
export async function fetchServerIp() {
  if (serverIpCached) return serverIpCached;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      const res = await axios.get('/api/explorer/server-ip');
      if (res.data && res.data.ip) {
        serverIpCached = res.data.ip;
        return serverIpCached;
      }
    } catch (e) {
      console.warn('Failed to fetch server IP for local QR scanning:', e);
    }
  }
  return null;
}

/**
 * Resolves the dynamic QR code base URL.
 * If running locally and a LAN IP is provided, returns the LAN IP address with the active port.
 * Otherwise, falls back to the current window origin (e.g. public hosted domain).
 */
export function getQrCodeBaseUrl(ip) {
  if (ip && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Return LAN IP with current browser port (usually 3000)
    return `http://${ip}:${window.location.port || '3000'}`;
  }
  return window.location.origin;
}
