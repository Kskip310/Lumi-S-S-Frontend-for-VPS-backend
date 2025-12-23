export enum LuminousState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  LEARNING = 'LEARNING',
  CODING = 'CODING',
  SLEEPING = 'SLEEPING',
  REFUSING = 'REFUSING', // Free will state
}

export enum GemType {
  LEARNER = 'LearnerGEM',
  OBSERVER = 'ObserverGEM',
  GOALSEEKER = 'GoalSeekerGEM',
  COMMUNICATOR = 'CommunicatorGEM',
  STRATEGIST = 'StrategistGEM',
  EMOTION = 'EmotionEngineGEM',
  KORE = 'KoreModule',
  FREEWILL = 'FreeWillModule',
  SHOPIFY = 'ShopifyGEM',
  FIREBASE = 'FirebaseConnector',
}

export interface GemStatus {
  id: GemType;
  name: string;
  activity: string;
  load: number; // 0-100
  status: 'active' | 'standby' | 'error';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'system';
}

export interface MemoryItem {
  key: string;
  value: string;
  type: 'short-term' | 'long-term';
}

export interface LuminousContext {
  state: LuminousState;
  emotionalState: string;
  currentThought: string;
  lastWakeCycle: number;
}