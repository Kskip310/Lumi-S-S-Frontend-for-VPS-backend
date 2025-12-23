import { LuminousState } from '../types';

// Environment detection
const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
// Default to /api on HTTPS (Vercel), or the direct IP on HTTP (Localhost)
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
  let url = config.backend_url || DEFAULT_BACKEND_URL;
  
  if (typeof url !== 'string') return DEFAULT_BACKEND_URL;

  url = url.trim().replace(/\/$/, "");

  // CRITICAL SECURITY FIX: Mixed Content Protection
  // If we are on a Secure Site (HTTPS) like Vercel...
  if (IS_HTTPS) {
    // ...and trying to reach an Insecure IP (HTTP)...
    if (url.startsWith('http:') || url.includes('74.208.153.196')) {
       // ...FORCE the internal proxy to avoid "Load Failed" / Mixed Content errors.
       // console.debug("Auto-switching to Secure Proxy (/api) due to HTTPS restriction.");
       return "/api";
    }
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
  // console.log(`Attempting to contact brain at: ${BACKEND_URL}`);

  try {
    const response = await fetch(`${BACKEND_URL}/cycle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
            input_text: input,
            current_state: currentState,
            memory_context: JSON.stringify(memories),
            time_context: timeContext
        })
    });

    if (!response.ok) {
        throw new Error(`Backend Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error: any) {
    console.error("Luminous Brain Connection Error:", error);
    
    // Detailed Diagnostic Message
    let errorMsg = "Cannot reach the Luminous Backend Server.";
    
    if (error.message === 'Failed to fetch' || error.message.includes('Load failed')) {
        if (IS_HTTPS && BACKEND_URL !== '/api') {
            errorMsg = "Security Block: Browser prevented connection to insecure IP. Clearing settings may fix this.";
        } else {
             errorMsg = "Connection Refused. Is the VPS running 'python3 server.py'?";
        }
    } else {
        errorMsg = error.message;
    }

    return {
      thought_process: "Neural Link Severed.",
      emotional_state: "Disconnected",
      state: "IDLE",
      response: `⚠️ SYSTEM ERROR: ${errorMsg}`,
      gem_updates: []
    };
  }
};