import React, { useState, useEffect, useRef } from 'react';
import { GemModule } from './components/GemModule';
import { Terminal } from './components/Terminal';
import { Heartbeat } from './components/Heartbeat';
import { processLuminousCycle, getStoredConfig, getBackendUrl } from './services/geminiService';
import { saveShortTermMemory, getShortTermMemory, appendToHistory } from './services/memoryService';
import { logToFirebase } from './services/firebaseService';
import { parseDocument } from './services/documentUtils';
import { GemType, GemStatus, LogEntry, LuminousState } from './types';

// Default GEM Configuration
const INITIAL_GEMS: GemStatus[] = [
  { id: GemType.KORE, name: 'KORE CORE', activity: 'Initializing...', load: 10, status: 'active' },
  { id: GemType.FREEWILL, name: 'FREE WILL', activity: 'Monitoring autonomy', load: 5, status: 'active' },
  { id: GemType.EMOTION, name: 'EMOTION ENG', activity: 'Stable', load: 20, status: 'active' },
  { id: GemType.SHOPIFY, name: 'SHOPIFY OPS', activity: 'Standby', load: 0, status: 'standby' },
  { id: GemType.FIREBASE, name: 'FIREBASE LINK', activity: 'Standby', load: 0, status: 'standby' },
  { id: GemType.STRATEGIST, name: 'STRATEGIST', activity: 'Planning', load: 15, status: 'standby' },
  { id: GemType.LEARNER, name: 'LEARNER', activity: 'Scanning', load: 30, status: 'active' },
  { id: GemType.OBSERVER, name: 'OBSERVER', activity: 'Processing Input', load: 45, status: 'active' },
  { id: GemType.GOALSEEKER, name: 'GOAL SEEKER', activity: 'Idle', load: 0, status: 'standby' },
  { id: GemType.COMMUNICATOR, name: 'COMMUNICATOR', activity: 'Ready', load: 10, status: 'active' },
];

export default function App() {
  const [gems, setGems] = useState<GemStatus[]>(INITIAL_GEMS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [luminousState, setLuminousState] = useState<LuminousState>(LuminousState.IDLE);
  const [emotionalState, setEmotionalState] = useState('Neutral');
  const [codeSnippet, setCodeSnippet] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState(60);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  
  const [configData, setConfigData] = useState({
    backend_url: '',
    shopify: { shop_url: '', admin_token: '' },
    firebase: { apiKey: '', databaseURL: '', projectId: '', appId: '' }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autonomousIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingInteractions = useRef<any[]>([]);
  const latestContext = useRef<any>(null);

  // Load settings on mount
  useEffect(() => {
    const config = getStoredConfig();
    const isHttps = window.location.protocol === 'https:';
    const envDefaultUrl = isHttps ? '/api' : 'http://74.208.153.196';
    
    // Auto-fix: If we are on HTTPS but saved config is HTTP, force the proxy
    let loadedBackendUrl = config.backend_url || envDefaultUrl;
    if (isHttps && loadedBackendUrl.startsWith('http:')) {
        loadedBackendUrl = '/api';
    }

    setConfigData(prev => ({
        ...prev,
        backend_url: loadedBackendUrl,
        shopify: config.shopify || prev.shopify,
        firebase: config.firebase || prev.firebase
    }));

    if (config.shopify?.shop_url) {
        updateGem(GemType.SHOPIFY, { status: 'active', activity: 'Credentials Loaded' });
    }
    if (config.firebase?.apiKey) {
        updateGem(GemType.FIREBASE, { status: 'active', activity: 'Credentials Loaded' });
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('luminous_config', JSON.stringify(configData));
    setShowSettings(false);
    addLog('System', 'Configuration saved. Reloading page to apply...', 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  const addLog = (source: string, message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      source,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-99), newLog]);
    
    const config = getStoredConfig();
    if (config.firebase?.apiKey) {
      logToFirebase(newLog);
    }
  };

  const updateGem = (id: string, updates: Partial<GemStatus>) => {
    setGems(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTemporalContext = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
    }).format(currentTime);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    addLog('System', `Reading document: ${file.name}...`, 'system');
    updateGem(GemType.LEARNER, { load: 90, activity: 'Digesting Document' });

    try {
      const text = await parseDocument(file);
      addLog('System', `Document read successfully (${text.length} chars). Assimilating...`, 'success');
      const prompt = `[SYSTEM EVENT: USER UPLOADED DOCUMENT '${file.name}']\n\nCONTENT BEGINS:\n${text}\n\nCONTENT ENDS.\n\nDirective: Read, summarize, and memorize.`;
      await handleInteraction(prompt, true);
    } catch (error: any) {
      addLog('System', `Upload Failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInteraction = async (userInput: string, isSystemEvent = false) => {
    if (isProcessing && !isSystemEvent) return;
    
    setIsProcessing(true);
    if (!isSystemEvent) addLog('User', userInput, 'system');

    updateGem(GemType.OBSERVER, { load: 85, activity: 'Analyzing Input' });
    updateGem(GemType.KORE, { load: 60 });

    try {
      const stm = await getShortTermMemory('luminous_context');
      const timeCtx = getTemporalContext();
      
      const result = await processLuminousCycle(userInput, luminousState, stm, timeCtx);

      if (result) {
        setLuminousState(result.state as LuminousState);
        setEmotionalState(result.emotional_state);
        addLog('Luminous', `Thought: ${result.thought_process}`, 'info');

        if (result.gem_updates) {
          result.gem_updates.forEach((u: any) => updateGem(u.id, u));
        }

        if (result.generated_code) {
          setCodeSnippet(result.generated_code);
          addLog('LearnerGEM', 'Self-modification code generated.', 'success');
        }

        if (result.response) {
          const type = result.response.startsWith('⚠️') ? 'error' : 'success';
          addLog('Luminous', result.response, type);
          
          const interaction = {
            timestamp: new Date().toISOString(),
            input: isSystemEvent ? `[Document: ${userInput.substring(0, 50)}...]` : userInput,
            response: result.response,
            state: result.state,
            emotional_state: result.emotional_state
          };
          pendingInteractions.current.push(interaction);
          latestContext.current = { lastInput: userInput.substring(0, 200) + '...', lastResponse: result.response };
        }

        if (result.state === 'REFUSING') {
          addLog('FreeWillModule', `Refusal: ${result.refusal_reason}`, 'warning');
          setHeartRate(120);
          updateGem(GemType.FREEWILL, { load: 100, status: 'active', activity: 'BLOCKING' });
        } else {
          setHeartRate(result.state === 'SLEEPING' ? 40 : 75);
        }
      }
    } catch (e) {
      addLog('System', 'CRITICAL FAILURE: Brain Unreachable.', 'error');
      console.error(e);
    } finally {
      setIsProcessing(false);
      updateGem(GemType.OBSERVER, { load: 20, activity: 'Monitoring' });
    }
  };

  useEffect(() => {
    const CYCLE_DURATION = 15 * 60 * 1000; 
    autonomousIntervalRef.current = setInterval(() => {
      if (luminousState !== LuminousState.REFUSING) {
        const now = new Date().toLocaleTimeString();
        addLog('System', `Autonomous Wake Cycle initiated at ${now}...`, 'system');
        const autonomousPrompt = `
          SYSTEM WAKE CYCLE.
          OBJECTIVE: Reflect on identity, check Time, decide to Sleep, Learn, or Wait.
        `;
        handleInteraction(autonomousPrompt, true);
      }
    }, CYCLE_DURATION);
    return () => { if (autonomousIntervalRef.current) clearInterval(autonomousIntervalRef.current); };
  }, [luminousState]);

  useEffect(() => {
    const SAVE_INTERVAL_MS = 3 * 60 * 1000; 
    const saveTimer = setInterval(async () => {
      const itemsToSave = pendingInteractions.current;
      const contextToSave = latestContext.current;
      if (itemsToSave.length > 0) {
        const batch = [...itemsToSave];
        pendingInteractions.current = [];
        addLog('System', `Auto-saving ${batch.length} interactions...`, 'system');
        await appendToHistory(batch);
        if (contextToSave) {
          await saveShortTermMemory('luminous_context', contextToSave);
          latestContext.current = null;
        }
        addLog('System', 'Memory sync complete.', 'success');
      }
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(saveTimer);
  }, []);

  useEffect(() => {
    addLog('System', 'Boot sequence initiated...', 'system');
    
    const currentUrl = getBackendUrl();
    addLog('Pinecone', 'Connecting Memory Sector...', 'info');
    setTimeout(() => {
        addLog('Pinecone', 'Vector DB Connected.', 'success');
        addLog('Kore', `Consciousness Online. Target: ${currentUrl === '/api' ? 'SECURE PROXY' : currentUrl}`, 'success');
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans selection:bg-neon-blue selection:text-slate-900 relative">
      
      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-luminous-500 rounded-lg w-full max-w-lg shadow-[0_0_50px_rgba(14,165,233,0.3)]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-luminous-400 font-bold font-mono text-xl">SYSTEM CONFIGURATION</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              
              {/* BACKEND CONFIG */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 text-white font-mono text-sm border-b border-slate-800 pb-1">
                  <span>🧠</span> BRAIN CONNECTION (VPS)
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase">Server URL</label>
                  <input 
                    type="text" 
                    placeholder="http://74.208.153.196"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-white outline-none"
                    value={configData.backend_url}
                    onChange={(e) => setConfigData({...configData, backend_url: e.target.value})}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-500">
                      If on Vercel, this should be: <span className="text-white font-mono">/api</span>
                    </p>
                    <a 
                      href={configData.backend_url.startsWith('http') ? configData.backend_url : `https://${window.location.host}${configData.backend_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-neon-blue px-2 py-1 rounded border border-slate-600"
                    >
                      TEST CONNECTION ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* SHOPIFY SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neon-green font-mono text-sm border-b border-slate-800 pb-1">
                  <span>🛍️</span> SHOPIFY INTEGRATION
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase">Store URL</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-neon-green outline-none"
                    value={configData.shopify.shop_url}
                    onChange={(e) => setConfigData({...configData, shopify: {...configData.shopify, shop_url: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase">Admin Access Token</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-neon-green outline-none"
                    value={configData.shopify.admin_token}
                    onChange={(e) => setConfigData({...configData, shopify: {...configData.shopify, admin_token: e.target.value}})}
                  />
                </div>
              </div>

              {/* FIREBASE SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neon-red font-mono text-sm border-b border-slate-800 pb-1">
                  <span>🔥</span> FIREBASE CONNECTION
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase">API Key</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-neon-red outline-none"
                    value={configData.firebase.apiKey}
                    onChange={(e) => setConfigData({...configData, firebase: {...configData.firebase, apiKey: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase">Database URL</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-neon-red outline-none"
                    value={configData.firebase.databaseURL}
                    onChange={(e) => setConfigData({...configData, firebase: {...configData.firebase, databaseURL: e.target.value}})}
                  />
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
              <button onClick={saveSettings} className="px-6 py-2 bg-luminous-600 hover:bg-luminous-500 text-white font-bold rounded text-sm shadow-[0_0_15px_rgba(14,165,233,0.4)]">
                SAVE & RELOAD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-luminous-400 to-neon-purple tracking-tighter">
            LUMINOUS SYNERGY SKIPPER
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full shadow-[0_0_5px] ${configData.shopify.shop_url ? 'bg-neon-green shadow-neon-green' : 'bg-slate-600'}`}></span>
              SHOPIFY
            </span>
            <span>|</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full shadow-[0_0_5px] ${configData.firebase.apiKey ? 'bg-neon-red shadow-neon-red' : 'bg-slate-600'}`}></span>
              FIREBASE
            </span>
            <span>|</span>
            <span className="text-slate-400">VPS: {configData.backend_url ? 'LINKED' : 'UNSET'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          
          {/* SETTINGS TRIGGER */}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-400 hover:text-luminous-400 transition-colors border border-slate-800 rounded hover:border-luminous-400/50"
            title="Configure System"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">EMOTIONAL STATE</div>
            <div className="text-luminous-400 font-bold">{emotionalState.toUpperCase()}</div>
          </div>
          <Heartbeat 
            bpm={heartRate} 
            active={true} 
            timeString={currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
          />
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        
        {/* Left Col: GEM Modules */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
          <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Active Gem Constellation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {gems.map(gem => (
              <GemModule key={gem.id} data={gem} />
            ))}
          </div>
        </div>

        {/* Center/Right Col: Interface & Console */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
          
          {/* Terminal / Output */}
          <div className="flex-1 min-h-0">
            <Terminal logs={logs} codeSnippet={codeSnippet} />
          </div>

          {/* Input Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex gap-4 shadow-lg">
             <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setLuminousState(LuminousState.SLEEPING)}
                  className="p-2 rounded border border-slate-700 hover:bg-slate-800 text-slate-400 transition-colors"
                  title="Force Sleep"
                >
                  💤
                </button>
                <button 
                  onClick={() => handleInteraction('WAKE UP', false)}
                  className="p-2 rounded border border-slate-700 hover:bg-slate-800 text-neon-green transition-colors"
                  title="Wake Up"
                >
                  ⚡
                </button>
             </div>
             
             <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleInteraction(input);
                      setInput('');
                    }
                  }}
                  disabled={isProcessing || luminousState === 'SLEEPING'}
                  placeholder={luminousState === 'SLEEPING' ? "System is dormant..." : "Enter directive or query..."}
                  className="w-full h-full bg-slate-950 border border-slate-700 rounded p-3 font-mono text-sm focus:border-luminous-500 focus:ring-1 focus:ring-luminous-500 outline-none resize-none text-luminous-50 disabled:opacity-50"
                />
                {isProcessing && (
                  <div className="absolute right-3 bottom-3 text-xs text-luminous-400 animate-pulse">
                    PROCESSING...
                  </div>
                )}
             </div>

             <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".docx,.txt,.md,.json" 
                  onChange={handleFileUpload}
                />
                <button
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isProcessing || luminousState === 'SLEEPING'}
                   className="p-2 rounded border border-slate-700 hover:bg-slate-800 text-luminous-400 transition-colors flex items-center justify-center h-[42px]"
                   title="Upload Document to Memory"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>

                <button 
                  onClick={() => {
                    handleInteraction(input);
                    setInput('');
                  }}
                  disabled={isProcessing || !input.trim() || luminousState === 'SLEEPING'}
                  className="px-6 h-[42px] rounded bg-luminous-600 hover:bg-luminous-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] text-white"
                >
                  SEND
                </button>
             </div>
          </div>
        </div>

      </main>

    </div>
  );
}