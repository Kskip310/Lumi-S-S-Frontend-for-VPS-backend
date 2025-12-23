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
  const config = getStoredConfig();
  const BACKEND_URL = getBackendUrl();
  const GEMINI_API_KEY = config.gemini_api_key || '';

  try {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // If user provided a key, send it to the backend to override server defaults
    if (GEMINI_API_KEY) {
        headers['X-Gemini-API-Key'] = GEMINI_API_KEY;
    }

    const response = await fetch(`${BACKEND_URL}/cycle`, {
        method: 'POST',
        headers,
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
            input_text: input,
            current_state: currentState,
            memory_context: JSON.stringify(memories || {}),
            time_context: timeContext
        })
    });

    if (!response.ok) {
        let errorDetails = response.statusText;
        try {
            // Try to read the error body (e.g., Python stack trace or API error message)
            const errorText = await response.text();
            if (errorText) {
                // If it looks like HTML (Vercel error page), just give a summary
                if (errorText.includes('<!DOCTYPE html>')) {
                    errorDetails = `${response.status} Server Error (Proxy/Timeout)`;
                } else {
                    // It's likely a text/json error from Python
                    errorDetails = `${response.status} - ${errorText.substring(0, 300)}`;
                }
            }
        } catch (e) { /* ignore read error */ }

        throw new Error(`Backend Failure: ${errorDetails}`);
    }

    const data = await response.json();
    return data;

  } catch (error: any) {
    console.error("Luminous Brain Connection Error:", error);
    
    let errorMsg = "Cannot reach the Luminous Backend Server.";
    let newState = "IDLE";
    let newEmotion = "Disconnected";
    
    // DETECT API QUOTA EXHAUSTION (429)
    if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('Quota exceeded')) {
        errorMsg = "CRITICAL: Neural Energy Depleted. Google Gemini API Quota Exceeded. Please add a paid API Key in Settings.";
        newState = "SLEEPING";
        newEmotion = "Exhausted";
    }
    // DETECT BACKEND FAILURES
    else if (error.message.includes('Backend Failure')) {
        errorMsg = error.message;
        // Clean up raw JSON for display
        if (errorMsg.includes('{"detail"')) {
             try {
                 const jsonPart = errorMsg.substring(errorMsg.indexOf('{'));
                 const parsed = JSON.parse(jsonPart);
                 if (parsed.detail) errorMsg = `System Error: ${parsed.detail}`;
             } catch (e) {}
        }
    } 
    // DETECT NETWORK/SECURITY BLOCKS
    else if (error.message === 'Failed to fetch' || error.message.includes('Load failed')) {
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
      emotional_state: newEmotion,
      state: newState,
      response: `⚠️ ${errorMsg}`,
      gem_updates: []
    };
  }
};