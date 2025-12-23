import { LuminousState } from '../types';

// If we are on HTTPS (like Vercel), use the /api proxy.
// If we are on HTTP (localhost), use the direct IP.
const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
const DEFAULT_BACKEND_URL = IS_HTTPS ? "/api" : "http://74.208.153.196";

export const getStoredConfig = () => {
  try {
    const saved = localStorage.getItem('luminous_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Config Load Error:", error);
  }
  return {};
};

export const getBackendUrl = () => {
  const config = getStoredConfig();
  // Remove trailing slash if present
  let url = config.backend_url || DEFAULT_BACKEND_URL;
  url = url.replace(/\/$/, "");

  // CRITICAL FIX: Mixed Content Protection
  // If we are on HTTPS (Vercel) but the URL is HTTP (Direct IP),
  // the browser will block the request. We MUST force the /api proxy.
  if (IS_HTTPS && url.startsWith('http:')) {
    console.warn("Security Override: Mixed Content blocked. Switching to /api proxy.");
    return "/api";
  }

  return url;
};

export const processLuminousCycle = async (
  input: string, 
  currentState: LuminousState,
  memories: any,
  timeContext: string
): Promise<any> => {
  const BACKEND_URL = getBackendUrl();

  try {
    const response = await fetch(`${BACKEND_URL}/cycle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input_text: input,
            current_state: currentState,
            memory_context: JSON.stringify(memories),
            time_context: timeContext
        })
    });

    if (!response.ok) {
        throw new Error(`Backend Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Luminous Brain Connection Error:", error);
    
    // Diagnostic Message
    let errorMsg = "Cannot reach the Luminous Backend Server.";
    
    // Check if we are using the proxy but it failed (likely backend is down)
    if (BACKEND_URL === '/api') {
        errorMsg = "Proxy Connect Failed. Ensure 'python3 server.py' is running on the VPS.";
    } else if (IS_HTTPS && BACKEND_URL.startsWith('http:')) {
        errorMsg = "SECURITY BLOCK: Browser blocked insecure HTTP request. Please refresh page.";
    }

    return {
      thought_process: "Connection to Neural Core lost.",
      emotional_state: "Disconnected",
      state: "IDLE",
      response: `⚠️ SYSTEM ERROR: ${errorMsg}`,
      gem_updates: []
    };
  }
};