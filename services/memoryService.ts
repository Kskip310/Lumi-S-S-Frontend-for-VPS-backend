import { MemoryItem } from '../types';

const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
const DEFAULT_BACKEND_URL = IS_HTTPS ? "/api" : "http://74.208.153.196";

const getBackendUrl = () => {
  try {
    const saved = localStorage.getItem('luminous_config');
    if (saved) {
      const config = JSON.parse(saved);
      const url = config.backend_url || DEFAULT_BACKEND_URL;
      return url.replace(/\/$/, "");
    }
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
      body: JSON.stringify({ key, value })
    });
  } catch (error) {
    console.error("Memory Save Error:", error);
  }
};

export const getShortTermMemory = async (key: string): Promise<any | null> => {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/memory/short?key=${key}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Memory Read Error:", error);
    return null;
  }
};

export const appendToHistory = async (items: any[]): Promise<void> => {
  try {
    const BACKEND_URL = getBackendUrl();
    await fetch(`${BACKEND_URL}/memory/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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