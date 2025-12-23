import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';

// Helper to get config
const getStoredFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem('luminous_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only return if it looks like a valid firebase config
      if (parsed.firebase && parsed.firebase.apiKey) {
        return parsed.firebase;
      }
    }
  } catch (e) {
    console.error("Error reading firebase config", e);
  }
  return null;
};

const firebaseConfig = getStoredFirebaseConfig();

let app;
let db: any;

if (firebaseConfig) {
    try {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        console.log("Firebase Initialized via Settings");
    } catch (e) {
        console.error("Firebase Init Error:", e);
    }
}

export const logToFirebase = (entry: any) => {
    if (!db) return;
    try {
        const logsRef = ref(db, 'luminous_logs');
        const newLogRef = push(logsRef);
        set(newLogRef, {
            ...entry,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Firebase Write Error:", e);
    }
};

export const syncStateWithFirebase = (callback: (state: any) => void) => {
    if (!db) return;
    const stateRef = ref(db, 'luminous_state');
    onValue(stateRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
};