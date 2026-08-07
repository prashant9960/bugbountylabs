import { useState, useEffect } from 'react';

// Simple UUID generator for stateless session management simulation
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

export default function JwtAlgNone() {
  const [sessionId, setSessionId] = useState('');
  const [labState, setLabState] = useState(null);
  
  // Scene Management
  const [scene, setScene] = useState('LOGIN'); 
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);
  
  // JWT Editor States (Pre-populated)
  const defaultHeader = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  const defaultPayload = '{\n  "sub": "usr_8921",\n  "email": "hunter@lab.local",\n  "iat": 1700000000,\n  "exp": 1700003600\n}';
  const defaultSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const [jwtHeader, setJwtHeader] = useState(defaultHeader);
  const [jwtPayload] = useState(defaultPayload); // Static
  const [jwtSignature, setJwtSignature] = useState(defaultSignature);
  
  // Interaction tracking (Prevents API spam)
  const [hasModifiedHeader, setHasModifiedHeader] = useState(false);
  const [hasRemovedSig, setHasRemovedSig] = useState(false);

  // Micro-states for enhanced realism
  const [loginText, setLoginText] = useState('Login to Workspace');
  const [forwardingText, setForwardingText] = useState('Forwarding Request...');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  
  // Cinematic Animations
  const [dialogueStep, setDialogueStep] = useState(0);
  const [explainStep, setExplainStep] = useState(0);
  const [flowAnim, setFlowAnim] = useState(0);
  
  // Quiz & Verification
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Initialize Session
  useEffect(() => {
    let id = localStorage.getItem('hunter_session_jwt');
    if (!id) {
      id = generateSessionId();
      localStorage.setItem('hunter_session_jwt', id);
    }
    setSessionId(id);
  }, []);

  // Fetch state once session is ready
  useEffect(() => {
    if (sessionId) fetchState(true);
  }, [sessionId]);

  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      ...(options.headers || {})
    };
    return fetch(endpoint, { ...options, headers });
  };

  // Track user edits for the timeline ONCE
  useEffect(() => {
    if (scene === 'INSPECT' && !hasModifiedHeader && jwtHeader !== defaultHeader) {
      setHasModifiedHeader(true);
      if (!isReplaying) apiFetch("/api/jwt-alg-none", { method: "POST", body: JSON.stringify({ type: 'MARK_HEADER_MODIFIED' }) }).then(() => fetchState(false));
    }
  }, [jwtHeader, scene, hasModifiedHeader, isReplaying]);

  useEffect(() => {
    if (scene === 'INSPECT' && !hasRemovedSig && jwtSignature !== defaultSignature && jwtSignature.trim() === '') {
      setHasRemovedSig(true);
      if (!isReplaying) apiFetch("/api/jwt-alg-none", { method: "POST", body: JSON.stringify({ type: 'MARK_SIG_REMOVED' }) }).then(() => fetchState(false));
    }
  }, [jwtSignature, scene, hasRemovedSig, isReplaying]);

  // Dialogue & Flow Animations
  useEffect(() => {
    if (scene === 'EXPLAIN' && explainStep === 0) {
      setDialogueStep(0);
      const t1 = setTimeout(() => setDialogueStep(1), 800);
      const t2 = setTimeout(() => setDialogueStep(2), 2500);
      const t3 = setTimeout(() => setDialogueStep(3), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    if (scene === 'EXPLAIN' && explainStep === 1) {
      setFlowAnim(0);
      const timers = [1,2,3,4,5,6,7].map(i => setTimeout(() => setFlowAnim(i), i * 600));
      return () => timers.forEach(clearTimeout);
    }
  }, [scene, explainStep]);

  const fetchState = async (syncScene = false) => {
    try {
      const res = await apiFetch("/api/jwt-alg-none");
      const data = await res.json();
      setLabState(data);
      
      if (syncScene && !isResetting && !isReplaying && data.scene) {
        setScene(data.scene);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (message, type = 'default') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const resetLab = async (silent = false) => {
    if (!silent) setIsResetting(true);
    await apiFetch("/api/jwt-alg-none", { method: "DELETE" });
    
    setScene('LOGIN');
    setJwtHeader(defaultHeader);
    setJwtSignature(defaultSignature);
    setHasModifiedHeader(false);
    setHasRemovedSig(false);
    setLoginText('Login to Workspace');
    setExplainStep(0);
    setDialogueStep(0);
    setFlowAnim(0);
    setSelectedAnswer("");
    setShowFlagModal(false);
    await fetchState(false);

    if (!silent) setTimeout(() => setIsResetting(false), 400);
  };

  // --- SCENE ACTIONS ---

  const handleLogin = async (e) => {
    if(e) e.preventDefault();
    setIsAuthenticating(true);
    setLoginText('Authenticating...');
    
    await apiFetch("/api/jwt-alg-none", { method: "POST", body: JSON.stringify({ type: 'LOGIN' }) });
    await fetchState(false);

    setTimeout(() => setLoginText('JWT Generated...'), 600);
    setTimeout(() => {
      setIsAuthenticating(false);
      setScene('INSPECT');
    }, 1200);
  };

  const handlePrediction = async (prediction) => {
    setIsForwarding(true);
    setForwardingText('Forwarding Request...');
    
    await apiFetch("/api/jwt-alg-none", {
      method: "POST",
      body: JSON.stringify({ type: 'MAKE_PREDICTION', payload: { prediction } })
    });
    
    setScene('FORWARDING_UI');
    
    setTimeout(() => setForwardingText('Reading Header...'), 600);
    setTimeout(() => setForwardingText('Verifying Token...'), 1200);

    setTimeout(async () => {
      const res = await apiFetch("/api/jwt-alg-none", {
        method: "POST",
        body: JSON.stringify({ type: 'FORWARD_REQUEST', payload: { header: jwtHeader, signature: jwtSignature } })
      });
      const data = await res.json();
      await fetchState(false);
      
      setIsForwarding(false);

      if (data.success) {
        setScene('DASHBOARD');
      } else {
        showToast(data.message, "error");
        setScene('INSPECT'); 
      }
    }, 1800);
  };

  // Automated Replay Engine
  const handleReplay = async () => {
    setShowFlagModal(false);
    setIsReplaying(true);
    await resetLab(true); // Silent reset

    // Automated Sequence
    setTimeout(() => handleLogin(), 500);
    setTimeout(() => setJwtHeader('{\n  "alg": "none",\n  "typ": "JWT"\n}'), 3000);
    setTimeout(() => setJwtSignature(''), 4500);
    setTimeout(() => setScene('PREDICT'), 5500);
    setTimeout(() => handlePrediction('Accept'), 6500);
    
    setTimeout(() => setIsReplaying(false), 10000); // End replay lock
  };
  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await apiFetch("/api/jwt-alg-none?action=verify");
      const data = await res.json();
      if (data.complete && selectedAnswer === "server_trusted_client") {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        showToast("Verification failed. Review the mental model.", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };
  const currentStep = labState?.timelineStep || 1;
  if (!labState && scene !== 'LOGIN') {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm font-mono">Loading Session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] font-sans text-gray-200 pb-10 overflow-hidden relative selection:bg-blue-500/30 outline-none" tabIndex={0}>
      
      {/* PREMIUM TOAST */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm border backdrop-blur-md ${toast.type === 'error' ? 'bg-red-950/90 text-red-200 border-red-800' : 'bg-gray-900/90 text-white border-gray-700'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* RESET OVERLAY */}
      {isResetting && (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-gray-800 border-t-white rounded-full animate-spin mb-4"></div>
          <h2 className="text-white text-lg font-bold tracking-widest uppercase">Resetting Session...</h2>
        </div>
      )}

      {/* REPLAY OVERLAY BADGE */}
      {isReplaying && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg animate-pulse">
          Replay in Progress
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#09090b] border-b border-gray-800 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Hunter Labs</h1>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-0.5">Day 15: Algorithm Confusion</p>
          </div>
          <button onClick={() => resetLab(false)} disabled={isAuthenticating || isForwarding || isReplaying} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            Reset Lab
          </button>
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 md:p-6 gap-8 flex-1 mt-4 relative">
        
        {/* LEFT PANE */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative">
          
          {/* SCENE 1: SAAS LOGIN */}
          {scene === 'LOGIN' && (
            <div className="bg-[#111113] rounded-2xl shadow-2xl border border-gray-800 p-10 max-w-md mx-auto w-full animate-fade-in-up mt-10">
              <div className="text-center mb-10">
                <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-5 flex items-center justify-center text-white text-xl">⚡</div>
                <h2 className="text-2xl font-bold text-white">Sign in to Nova</h2>
                <p className="text-gray-500 text-sm mt-2">Welcome back to your workspace.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
                  <input type="email" disabled value="hunter@lab.local" className="w-full border border-gray-800 rounded-lg px-4 py-3 bg-[#09090b] text-gray-400 cursor-not-allowed shadow-inner focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Password</label>
                  <input type="password" disabled value="Password123" className="w-full border border-gray-800 rounded-lg px-4 py-3 bg-[#09090b] text-gray-400 cursor-not-allowed shadow-inner font-mono tracking-widest focus:outline-none" />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isAuthenticating || isReplaying}
                  className="w-full bg-white hover:bg-gray-200 disabled:opacity-80 text-black font-bold py-3.5 rounded-lg transition shadow-[0_0_20px_rgba(255,255,255,0.1)] flex justify-center items-center gap-2 mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111113]"
                >
                  {isAuthenticating ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : null}
                  {loginText}
                </button>
              </form>
            </div>
          )}

          {/* SCENE 2: INTERACTIVE INSPECTOR */}
          {scene === 'INSPECT' && (
            <div className="bg-[#111113] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col animate-fade-in-up min-h-[550px]">
              <div className="bg-[#18181b] px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Request Interceptor
                </span>
                <span className="text-xs font-mono bg-blue-900/30 text-blue-400 px-3 py-1 rounded border border-blue-500/30 font-bold shadow-sm">Response intercepted — 200 OK</span>
              </div>
              
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#09090b] text-gray-300 flex-1 space-y-6">
                
                {/* Simulated Response Context */}
                <div className="text-gray-500 mb-4 pb-4 border-b border-gray-800 select-none">
                  Set-Cookie: session_id={sessionId.substring(0,6)}...<br/>
                  Authorization: Bearer <span className="text-gray-300">eyJhbG...</span>
                </div>

                {/* JWT Header Editor (RED) */}
                <div className="relative group mt-2">
                  <div className="absolute -top-3 left-4 bg-[#111113] text-red-400 text-[10px] px-2 py-0.5 font-bold tracking-widest z-10 border border-gray-800 rounded flex items-center gap-1">
                    <span aria-hidden="true">★</span> HEADER
                  </div>
                  <textarea 
                    value={jwtHeader}
                    onChange={(e) => setJwtHeader(e.target.value)}
                    disabled={isReplaying}
                    className="w-full h-24 bg-[#18181b] text-red-300 border border-red-900/50 focus:border-red-500/50 rounded-lg p-4 pt-5 focus:outline-none resize-none font-mono transition-colors shadow-inner"
                    spellCheck="false"
                  />
                </div>

                {/* JWT Payload Editor (GREY / READONLY) */}
                <div className="relative group" title="Payload isn't today's lesson.">
                  <div className="absolute -top-3 left-4 bg-[#111113] text-gray-500 text-[10px] px-2 py-0.5 font-bold tracking-widest z-10 border border-gray-800 rounded flex items-center gap-1">
                    <span aria-hidden="true">🔒</span> PAYLOAD (Locked)
                  </div>
                  <textarea 
                    readOnly
                    value={jwtPayload}
                    className="w-full h-36 bg-[#18181b]/40 text-gray-500 border border-gray-800/50 rounded-lg p-4 pt-5 focus:outline-none resize-none font-mono cursor-not-allowed"
                    spellCheck="false"
                    tabIndex={-1}
                  />
                </div>

                {/* JWT Signature Editor (BLUE) */}
                <div className="relative group">
                  <div className="absolute -top-3 left-4 bg-[#111113] text-blue-400 text-[10px] px-2 py-0.5 font-bold tracking-widest z-10 border border-gray-800 rounded flex items-center gap-1">
                    <span aria-hidden="true">✍</span> SIGNATURE
                  </div>
                  <input 
                    type="text"
                    value={jwtSignature}
                    onChange={(e) => setJwtSignature(e.target.value)}
                    disabled={isReplaying}
                    className="w-full bg-[#18181b] text-blue-300 border border-blue-900/50 focus:border-blue-500/50 rounded-lg p-4 focus:outline-none font-mono transition-colors shadow-inner"
                    spellCheck="false"
                  />
                </div>

              </div>

              <div className="bg-[#111113] p-5 border-t border-gray-800 flex justify-end">
                <button 
                  onClick={() => setScene('PREDICT')}
                  disabled={isForwarding || isReplaying}
                  className="bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-black px-8 py-2.5 rounded-lg transition shadow-[0_0_15px_rgba(255,255,255,0.2)] text-sm disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111113]"
                >
                  Forward Request ➔
                </button>
              </div>
            </div>
          )}

          {/* SCENE 3: PREDICTION PAUSE */}
          {scene === 'PREDICT' && (
            <div className="absolute inset-0 bg-[#09090b]/95 backdrop-blur-md rounded-2xl z-20 flex flex-col items-center justify-center p-8 animate-fade-in border border-gray-800 shadow-2xl">
              <p className="text-blue-500 font-bold tracking-widest uppercase mb-4 text-sm animate-pulse">Wait.</p>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 text-center leading-tight">YOU ARE THE SERVER.</h1>
              <p className="text-xl text-gray-400 mb-12">Do you Accept or Reject this token?</p>
              
              <div className="flex gap-6 w-full max-w-sm">
                <button 
                  onClick={() => handlePrediction('Reject')}
                  disabled={isForwarding || isReplaying}
                  className="flex-1 bg-transparent border-2 border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold py-4 rounded-xl transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handlePrediction('Accept')}
                  disabled={isForwarding || isReplaying}
                  className="flex-1 bg-transparent border-2 border-green-500/50 hover:bg-green-500/10 text-green-400 font-bold py-4 rounded-xl transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Accept
                </button>
              </div>
            </div>
          )}

          {/* SCENE 3.5: FORWARDING DYNAMIC HEARTBEAT SUSPENSE */}
          {scene === 'FORWARDING_UI' && (
            <div className="absolute inset-0 bg-[#09090b]/95 backdrop-blur-md rounded-2xl z-20 flex flex-col items-center justify-center p-8 animate-fade-in border border-gray-800 shadow-2xl">
              <div className="w-12 h-12 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase animate-pulse">{forwardingText}</h1>
            </div>
          )}

          {/* SCENE 4: ADMIN DASHBOARD (THE PAYOFF) */}
          {scene === 'DASHBOARD' && (
            <div className="bg-gradient-to-br from-[#111113] to-[#09090b] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col animate-fade-in-up min-h-[500px]">
              <div className="bg-gray-900/50 px-6 py-4 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">⚡</div>
                  <h2 className="text-white font-bold tracking-wide">Nova Workspace</h2>
                </div>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/50 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
                  System Admin
                </span>
              </div>
              
              <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                  🔓
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Access Granted</h2>
                <p className="text-gray-400 mb-12">Welcome to the administration panel.</p>
                
                {!isReplaying && (
                  <button 
                    onClick={async () => {
                      setScene('EXPLAIN');
                      await apiFetch("/api/jwt-alg-none", { method: "POST", body: JSON.stringify({ type: 'BEGIN_EXPLANATION' }) });
                      await fetchState(false);
                    }} 
                    className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111113]"
                  >
                    Why did this work? ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SCENE 5: EXPLANATION SLIDES */}
          {(scene === 'EXPLAIN' || scene === 'VERIFY' || scene === 'COMPLETE') && (
            <div className="bg-[#111113] rounded-2xl shadow-2xl border border-gray-800 p-6 md:p-10 flex flex-col justify-center animate-fade-in min-h-[500px]">
              
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Logic Breakdown</span>
                <div className="flex gap-2">
                  <button onClick={() => setExplainStep(Math.max(0, explainStep - 1))} disabled={explainStep === 0} className="text-gray-500 hover:text-white disabled:opacity-30 focus:outline-none">◀</button>
                  <span className="text-gray-400 text-sm font-mono"><span className="text-blue-400 font-bold">{explainStep + 1}</span> / 5</span>
                  <button onClick={() => setExplainStep(Math.min(4, explainStep + 1))} disabled={explainStep === 4} className="text-gray-500 hover:text-white disabled:opacity-30 focus:outline-none">▶</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center text-center px-4">
                
                {explainStep === 0 && (
                  <div className="space-y-6 max-w-sm mx-auto w-full">
                    {dialogueStep >= 1 && (
                      <div className="animate-fade-in-up flex items-start gap-3 justify-end">
                        <div className="bg-blue-900/40 border border-blue-500/30 text-blue-100 p-3 rounded-2xl rounded-tr-sm text-sm text-right">
                          Token verify kis algorithm se karu?
                        </div>
                        <div className="text-2xl mt-1">🤖</div>
                      </div>
                    )}
                    {dialogueStep >= 2 && (
                      <div className="animate-fade-in-up flex items-start gap-3 justify-start">
                        <div className="text-2xl mt-1">📜</div>
                        <div className="bg-gray-800 border border-gray-700 text-gray-200 p-3 rounded-2xl rounded-tl-sm text-sm font-mono">
                          alg: "none"
                        </div>
                      </div>
                    )}
                    {dialogueStep >= 3 && (
                      <div className="animate-fade-in-up flex items-start gap-3 justify-end">
                        <div className="bg-blue-900/40 border border-blue-500/30 text-blue-100 p-3 rounded-2xl rounded-tr-sm text-sm text-right">
                          Theek hai... Skip kar deta hoon.
                        </div>
                        <div className="text-2xl mt-1">🤖</div>
                      </div>
                    )}
                  </div>
                )}

                {explainStep === 1 && (
                  <div className="animate-fade-in flex flex-col items-center w-full max-w-md mx-auto space-y-4">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">The Mistake</h3>
                    {flowAnim >= 1 && <div className="bg-gray-800 px-6 py-2 rounded shadow-lg text-sm animate-fade-in-up w-full">Client</div>}
                    {flowAnim >= 2 && <div className="text-gray-500 text-xl animate-fade-in-up">↓</div>}
                    {flowAnim >= 3 && <div className="bg-gray-800 px-6 py-2 rounded shadow-lg text-sm animate-fade-in-up w-full">JWT</div>}
                    {flowAnim >= 4 && <div className="text-gray-500 text-xl animate-fade-in-up">↓</div>}
                    {flowAnim >= 5 && <div className="bg-blue-900/30 text-blue-400 font-bold border border-blue-500/50 px-6 py-2 rounded shadow-lg text-sm animate-fade-in-up w-full">Server Reads Header: <span className="font-mono text-red-400">alg:none</span></div>}
                    {flowAnim >= 6 && <div className="text-gray-500 text-xl animate-fade-in-up">↓</div>}
                    {flowAnim >= 7 && <div className="bg-green-900/30 text-green-400 font-bold border border-green-500/50 px-6 py-2 rounded shadow-lg text-sm animate-fade-in-up w-full">Verification Skipped ➔ Admin</div>}
                  </div>
                )}

                {explainStep === 2 && (
                  <div className="animate-fade-in space-y-8">
                    <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed font-light">
                      Server should <strong className="text-white">already know</strong><br/>
                      how to verify a token.
                    </p>
                    <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed font-light">
                      It should <strong className="text-red-400">never ask</strong><br/>
                      the client.
                    </p>
                  </div>
                )}

                {explainStep === 3 && (
                  <div className="animate-fade-in flex flex-col md:flex-row gap-6 text-left items-stretch">
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl overflow-hidden flex-1">
                      <div className="bg-red-900/30 px-4 py-2 text-red-400 font-bold text-xs uppercase tracking-widest text-center border-b border-red-900/30">Bad Architecture</div>
                      <div className="p-6 font-mono text-sm space-y-3">
                        <p className="text-gray-500">// Reads header dynamically</p>
                        <p className="text-gray-300">const alg = token.header.alg;</p>
                        <p className="mt-2 text-gray-500">
                          verify(token, secret, <span className="text-red-400 font-bold">alg</span>);
                        </p>
                      </div>
                    </div>
                    <div className="bg-green-950/20 border border-green-900/30 rounded-xl overflow-hidden flex-1">
                      <div className="bg-green-900/30 px-4 py-2 text-green-400 font-bold text-xs uppercase tracking-widest text-center border-b border-green-900/30">Good Architecture</div>
                      <div className="p-6 font-mono text-sm space-y-3">
                        <p className="text-gray-500">// Hardcoded by server</p>
                        <p className="text-gray-300">const alg = "HS256";</p>
                        <p className="mt-2 text-gray-500">
                          verify(token, secret, <span className="text-green-400 font-bold">"HS256"</span>);
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {explainStep === 4 && (
                  <div className="animate-fade-in flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
                    <div className="w-full bg-[#18181b] border border-gray-800 rounded-xl p-8 text-center shadow-lg">
                      <p className="text-white font-bold text-xl mb-4 leading-tight">Server trusted the client's security decision.</p>
                      <p className="text-red-400 text-sm font-bold uppercase tracking-widest">Never let users choose security logic.</p>
                    </div>
                    
                    <button 
                      onClick={() => setScene('VERIFY')} 
                      className="mt-4 w-full bg-white text-black font-black py-3.5 rounded-lg hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111113]"
                    >
                      Solve Lab
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANE: Learning Journey Timeline & Hacker Console */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-40">
          
          {/* LEARNING JOURNEY TIMELINE */}
          <div className="bg-[#111113] rounded-xl shadow-xl border border-gray-800 overflow-hidden flex flex-col flex-1">
            <div className="bg-[#18181b] px-5 py-4 border-b border-gray-800">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Learning Journey</span>
            </div>
            <div className="p-6 bg-[#09090b] flex-1">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-800 before:via-gray-800 before:to-transparent">
                
                {/* Steps 1-8 driven by Timeline state */}
                {[
                  { id: 1, label: 'Login', color: 'gray' },
                  { id: 2, label: 'JWT Issued', color: 'gray' },
                  { id: 3, label: 'Header Modified', color: 'red' },
                  { id: 4, label: 'Signature Removed', color: 'blue' },
                  { id: 5, label: 'Prediction Recorded', color: 'purple' },
                  { id: 6, label: 'Request Sent', color: 'gray' },
                  { id: 7, label: 'Verification Skipped', color: 'yellow', icon: '!' },
                  { id: 8, label: 'Admin Access', color: 'green', icon: '🔓' }
                ].map(step => (
                  <div key={step.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= step.id ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= step.id ? `border-${step.color}-500 ${step.color !== 'gray' ? `bg-${step.color}-900/20 text-${step.color}-400` : 'text-gray-400'}` : 'border-gray-800'}`}>
                      {currentStep >= step.id && <span aria-hidden="true" className={step.icon ? 'text-[10px] font-black' : 'text-[10px]'}>{step.icon || '✔'}</span>}
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                      <p className={`font-bold ${currentStep >= step.id && step.color !== 'gray' ? `text-${step.color}-400` : 'text-gray-300'} ${step.id >= 7 ? 'tracking-wide' : ''}`}>{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HACKER CONSOLE */}
          <div className="bg-[#111113] rounded-xl p-6 shadow-xl border border-gray-800 flex flex-col relative overflow-hidden mt-auto">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-10h2v8h-2V7z"></path></svg>
            </div>
            
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Hacker Console
            </h3>
            
            <div className="mb-6 relative z-10">
              <p className="text-gray-300 text-sm font-medium mb-4">Why did access succeed?</p>
              
              <div className="space-y-3 text-sm">
                {[
                  { value: 'broken_crypto', label: 'JWT encryption was broken.' },
                  { value: 'payload_admin', label: 'The payload became admin.' },
                  { value: 'server_trusted_client', label: 'Server trusted client-controlled verification settings.', correct: true },
                  { value: 'no_security', label: 'JWT has no security.' }
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center p-3 rounded-lg border cursor-pointer transition focus-within:ring-2 focus-within:ring-blue-500 ${selectedAnswer === opt.value ? (opt.correct ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#18181b] border-gray-700') : 'border-gray-800 hover:bg-[#18181b]'}`}>
                    <input type="radio" name="quiz" value={opt.value} onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === opt.value} className="mr-3 focus:ring-0" />
                    <span className={selectedAnswer === opt.value && opt.correct ? "text-white font-medium" : "text-gray-300"}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={runVerification} 
              disabled={isVerifying || !selectedAnswer || scene !== 'VERIFY'}
              className="w-full bg-white hover:bg-gray-200 text-black font-black py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed mt-auto relative z-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111113]"
            >
              {isVerifying ? "Verifying..." : "Claim Flag"}
            </button>
          </div>

        </div>
      </div>

      {/* 🏆 GAMIFIED ACHIEVEMENT MODAL (Replaces Basic Flag Modal) */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-[#09090b]/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#111113] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-800">
            <div className="bg-gray-900 p-6 text-center border-b border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-400"></div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Day 15 Complete</p>
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">Algorithm Confusion</h2>
            </div>
            
            <div className="p-8 pb-6">
              
              <div className="flex justify-between items-center bg-[#18181b] border border-gray-800 rounded-xl p-4 mb-6">
                <div>
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Reward</p>
                  <p className="text-green-400 font-black text-xl">+15 XP</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Rank</p>
                  <p className="text-white font-bold">JWT Apprentice</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Captured Flag</p>
                <div className="bg-[#09090b] p-3 rounded-lg border border-gray-800 font-mono text-gray-300 font-bold text-sm select-all shadow-inner">
                  {flag}
                </div>
              </div>

              <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-5 mb-8 text-center shadow-lg">
                <p className="text-white font-bold text-md leading-tight mb-2">Server trusted the client's security decision.</p>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Never let users choose security logic.</p>
              </div>

              <div className="flex gap-4">
                <button onClick={handleReplay} className="flex-1 bg-[#18181b] hover:bg-gray-800 text-white text-center font-bold py-3.5 rounded-lg border border-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500">
                  Replay Exploit
                </button>
                <a href="/InformationDisclosure" className="flex-1 bg-white text-black text-center font-bold py-3.5 rounded-lg hover:bg-gray-200 transition shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white">
                  Next Lab <span aria-hidden="true">➔</span>
                </a>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}