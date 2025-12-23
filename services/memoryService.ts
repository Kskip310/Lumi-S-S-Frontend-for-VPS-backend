import { MemoryItem } from '../types';

const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
const DEFAULT_BACKEND_URL = IS_HTTPS ? "/api" : "http://74.208.153.196:5000";

const getBackendUrl = () => {
  try {
    const saved = localStorage.getItem('luminous_config');
    let url = DEFAULT_BACKEND_URL;
    
    if (saved) {
      const config = JSON.parse(saved);
      if (config.backend_url) url = config.backend_url;
    }
    
    if (typeof url !== 'string') return DEFAULT_BACKEND_URL;
    
    url = url.trim().replace(/\/$/, "");

    // CRITICAL SECURITY FIX: Mixed Content Protection
    if (IS_HTTPS) {
        if (url.startsWith('http:') || url.includes('74.208.153.196')) {
            return "/api";
        }
    }
    
    return url;
  } catch (e) {
    console.error("Config Read Error", e);
  }
  return DEFAULT_BACKEND_URL;
};

export const saveShortTermMemory = async (key: string, value: any): Promise<void> => {
  try {
    const BACKEND_URL = getBackendUrl();
    await fetch(`${BACKEND_URL}/memory/short`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({ key, value })
    });
  } catch (error) {
    console.error("Memory Save Error:", error);
  }
};

export const getShortTermMemory = async (key: string): Promise<any | null> => {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/memory/short?key=${key}`, {
        referrerPolicy: 'no-referrer'
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.result;
  } catch (error) {
    // Suppress console spam for common connection issues on initial load
    // console.error("Memory Read Error:", error);
    return null;
  }
};

export const appendToHistory = async (items: any[]): Promise<void> => {
  try {
    const BACKEND_URL = getBackendUrl();
    await fetch(`${BACKEND_URL}/memory/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({ items })
    });
  } catch (error) {
    console.error("History Append Error:", error);
  }
};

export const searchLongTermMemory = async (query: string): Promise<MemoryItem[]> => {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/memory/long/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ query })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
     return []; 
  }
};

export const saveLongTermMemory = async (content: string): Promise<void> => {
   // Placeholder for future implementation
};