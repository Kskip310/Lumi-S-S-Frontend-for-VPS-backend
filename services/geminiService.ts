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
  const url = config.backend_url || DEFAULT_BACKEND_URL;
  return url.replace(/\/$/, "");
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
    
    if (IS_HTTPS && BACKEND_URL.startsWith('http:')) {
      errorMsg = "SECURITY BLOCK: You are on HTTPS but trying to reach HTTP directly. Please clear your Browser Cache/Settings to reset to the '/api' proxy.";
    } else {
      errorMsg = "Check that 'python3 server.py' is running on your VPS.";
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