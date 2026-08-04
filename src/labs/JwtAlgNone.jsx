import { useState, useEffect } from 'react';

export default function JwtAlgNone() {
  const [labState, setLabState] = useState(null);
  const [scene, setScene] = useState('LOGIN'); 
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);
  
  // JWT Editor States (Pre-populated)
  const defaultHeader = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  const defaultPayload = '{\n  "sub": "usr_8921",\n  "email": "hunter@lab.local",\n  "iat": 1700000000,\n  "exp": 1700003600\n}';
  const defaultSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const [jwtHeader, setJwtHeader] = useState(defaultHeader);
  const [jwtPayload, setJwtPayload] = useState(defaultPayload);
  const [jwtSignature, setJwtSignature] = useState(defaultSignature);
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Cinematic Animations
  const [dialogueStep, setDialogueStep] = useState(0);
  const [explainStep, setExplainStep] = useState(0);
  
  // Quiz & Verification
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchState();
  }, []);

  // Track user edits for the timeline
  useEffect(() => {
    if (scene === 'INSPECT') {
      if (jwtHeader !== defaultHeader) {
        fetch("/api/jwt-alg-none", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: 'MARK_HEADER_MODIFIED' }) }).then(fetchState);
      }
    }
  }, [jwtHeader]);

  useEffect(() => {
    if (scene === 'INSPECT') {
      if (jwtSignature !== defaultSignature && jwtSignature.trim() === '') {
        fetch("/api/jwt-alg-none", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: 'MARK_SIG_REMOVED' }) }).then(fetchState);
      }
    }
  }, [jwtSignature]);

  // Dialogue Animation Progression
  useEffect(() => {
    if (scene === 'EXPLAIN' && explainStep === 0) {
      setDialogueStep(0);
      const t1 = setTimeout(() => setDialogueStep(1), 800);  // Server asks
      const t2 = setTimeout(() => setDialogueStep(2), 2500); // JWT replies
      const t3 = setTimeout(() => setDialogueStep(3), 4000); // Server accepts
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [scene, explainStep]);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/jwt-alg-none");
      const data = await res.json();
      setLabState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (message, type = 'default') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetLab = async () => {
    setIsResetting(true);
    await fetch("/api/jwt-alg-none", { method: "DELETE" });
    
    setScene('LOGIN');
    setJwtHeader(defaultHeader);
    setJwtPayload(defaultPayload);
    setJwtSignature(defaultSignature);
    setExplainStep(0);
    setDialogueStep(0);
    setSelectedAnswer("");
    await fetchState();

    setTimeout(() => setIsResetting(false), 400);
  };

  // --- SCENE ACTIONS ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    await fetch("/api/jwt-alg-none", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'LOGIN' })
    });
    await fetchState();

    setTimeout(() => {
      setIsAuthenticating(false);
      setScene('INSPECT');
    }, 600); // Realistic network delay
  };

  const handleForwardClick = () => {
    setScene('PREDICT');
  };

  const handlePrediction = async (prediction) => {
    await fetch("/api/jwt-alg-none", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'MAKE_PREDICTION', payload: { prediction } })
    });
    
    // Process the forward
    const res = await fetch("/api/jwt-alg-none", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: 'FORWARD_REQUEST', 
        payload: { header: jwtHeader, signature: jwtSignature } 
      })
    });
    const data = await res.json();
    await fetchState();

    setTimeout(async () => {
      if (data.success) {
        // Verification Skipped! Let's advance to Admin Access
        await fetch("/api/jwt-alg-none", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'GRANT_ADMIN' })
        });
        await fetchState();
        setScene('DASHBOARD');
      } else {
        showToast(data.message || "Request Rejected by Server.", "error");
        setScene('INSPECT'); // Send them back to try again
      }
    }, 800);
  };

  const startExplanation = async () => {
    setScene('EXPLAIN');
    await fetch("/api/jwt-alg-none", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'BEGIN_EXPLANATION' })
    });
    await fetchState();
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/jwt-alg-none?action=verify");
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

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] font-sans text-gray-200 pb-10 overflow-hidden relative selection:bg-blue-500/30">
      
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
          <h2 className="text-white text-lg font-bold tracking-widest uppercase">Resetting Lab...</h2>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#09090b] border-b border-gray-800 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Hunter Labs</h1>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-0.5">Day 15: Algorithm Confusion</p>
          </div>
          <button onClick={resetLab} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-sm font-bold px-4 py-2 rounded-lg transition">
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
                  <input type="email" disabled value="hunter@lab.local" className="w-full border border-gray-800 rounded-lg px-4 py-3 bg-[#09090b] text-gray-400 cursor-not-allowed shadow-inner" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Password</label>
                  <input type="password" disabled value="Password123" className="w-full border border-gray-800 rounded-lg px-4 py-3 bg-[#09090b] text-gray-400 cursor-not-allowed shadow-inner font-mono tracking-widest" />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isAuthenticating}
                  className="w-full bg-white hover:bg-gray-200 disabled:opacity-80 text-black font-bold py-3.5 rounded-lg transition shadow-[0_0_20px_rgba(255,255,255,0.1)] flex justify-center items-center gap-2 mt-4"
                >
                  {isAuthenticating ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'Login to Workspace'}
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
                <span className="text-xs font-mono bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/30">HTTP/1.1 200 OK</span>
              </div>
              
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#09090b] text-gray-300 flex-1 space-y-6">
                
                {/* Simulated Response Context */}
                <div className="text-gray-500 mb-4 pb-4 border-b border-gray-800 select-none">
                  Set-Cookie: session_id=8f92j...<br/>
                  Authorization: Bearer <span className="text-gray-300">eyJhbG...</span>
                </div>

                {/* JWT Header Editor */}
                <div className="relative group">
                  <div className="absolute -top-3 left-4 bg-[#111113] text-red-400 text-[10px] px-2 py-0.5 font-bold tracking-widest z-10 border border-gray-800 rounded">HEADER</div>
                  <textarea 
                    value={jwtHeader}
                    onChange={(e) => setJwtHeader(e.target.value)}
                    className="w-full h-24 bg-[#18181b] text-red-300 border border-gray-800 focus:border-red-500/50 rounded-lg p-4 pt-5 focus:outline-none resize-none font-mono"
                    spellCheck="false"
                  />
                </div>

                {/* JWT Payload Editor (Boring by design) */}
                <div className="relative group">
                  <div className="absolute -top-3 left-4 bg-[#111113] text-purple-400 text-[10px] px-2 py-0.5 font-bold tracking-widest z-10 border border-gray-800 rounded">PAYLOAD</div>
                  <textarea 
                    value={jwtPayload}
                    onChange={(e) => setJwtPayload(e.target.value)}
                    className="w-full h-36 bg-[#18181b] text-purple-300 border border-gray-800 focus:border-purple-500/50 rounded-lg p-4 pt-5 focus:outline-none resize-none font-mono"
                    spellCheck="false"
                  />
                </div>

                {/* JWT Signature Editor */}
                <div className="relative group">
                  <div className="absolute -top-3 left-4 bg-[#111113] text-blue-400 text-[10px] px-2 py-0.5 font-bold tracking-widest z-10 border border-gray-800 rounded">SIGNATURE</div>
                  <input 
                    type="text"
                    value={jwtSignature}
                    onChange={(e) => setJwtSignature(e.target.value)}
                    className="w-full bg-[#18181b] text-blue-300 border border-gray-800 focus:border-blue-500/50 rounded-lg p-4 focus:outline-none font-mono"
                    spellCheck="false"
                  />
                </div>

              </div>

              <div className="bg-[#111113] p-5 border-t border-gray-800 flex justify-end">
                <button 
                  onClick={handleForwardClick}
                  className="bg-white hover:bg-gray-200 text-black font-black px-8 py-2.5 rounded-lg transition shadow-[0_0_15px_rgba(255,255,255,0.2)] text-sm"
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
                  className="flex-1 bg-transparent border-2 border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold py-4 rounded-xl transition"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handlePrediction('Accept')}
                  className="flex-1 bg-transparent border-2 border-green-500/50 hover:bg-green-500/10 text-green-400 font-bold py-4 rounded-xl transition"
                >
                  Accept
                </button>
              </div>
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
                
                <button onClick={startExplanation} className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 transition">
                  Why did this work? ➔
                </button>
              </div>
            </div>
          )}

          {/* SCENE 5: EXPLANATION SLIDES */}
          {(scene === 'EXPLAIN' || scene === 'VERIFY' || scene === 'COMPLETE') && (
            <div className="bg-[#111113] rounded-2xl shadow-2xl border border-gray-800 p-10 flex flex-col justify-center animate-fade-in min-h-[500px]">
              
              {/* Controls */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Logic Breakdown</span>
                <div className="flex gap-2">
                  <button onClick={() => setExplainStep(Math.max(0, explainStep - 1))} disabled={explainStep === 0} className="text-gray-500 hover:text-white disabled:opacity-30">◀</button>
                  <span className="text-gray-400 text-sm font-mono"><span className="text-blue-400 font-bold">{explainStep + 1}</span> / 5</span>
                  <button onClick={() => setExplainStep(Math.min(4, explainStep + 1))} disabled={explainStep === 4} className="text-gray-500 hover:text-white disabled:opacity-30">▶</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center text-center px-4">
                
                {/* SLIDE 1: Character Dialogue */}
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
                          Theek hai. (Verification Skipped)
                        </div>
                        <div className="text-2xl mt-1">🤖</div>
                      </div>
                    )}
                  </div>
                )}

                {/* SLIDE 2: Concept Core */}
                {explainStep === 1 && (
                  <div className="animate-fade-in space-y-8">
                    <p className="text-2xl text-gray-300 leading-relaxed font-light">
                      Server should <strong className="text-white">already know</strong><br/>
                      how to verify a token.
                    </p>
                    <p className="text-2xl text-gray-300 leading-relaxed font-light">
                      It should <strong className="text-red-400">never ask</strong><br/>
                      the client.
                    </p>
                  </div>
                )}

                {/* SLIDE 3: Mental Model Flow */}
                {explainStep === 2 && (
                  <div className="animate-fade-in space-y-8">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6">The Mistake</h3>
                    <div className="flex flex-col items-center gap-4 text-sm font-mono text-gray-300 max-w-xs mx-auto">
                      <div className="bg-gray-800 border border-gray-700 px-6 py-3 rounded-lg w-full">Client controls verification</div>
                      <span className="text-gray-600">↓</span>
                      <div className="bg-gray-800 border border-gray-700 px-6 py-3 rounded-lg w-full">Server obeys</div>
                      <span className="text-gray-600">↓</span>
                      <div className="bg-red-900/30 border border-red-500/30 text-red-400 font-bold px-6 py-3 rounded-lg w-full">Verification Skipped</div>
                    </div>
                  </div>
                )}

                {/* SLIDE 4: Good vs Bad Architecture */}
                {explainStep === 3 && (
                  <div className="animate-fade-in grid grid-cols-2 gap-6 text-left">
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl overflow-hidden">
                      <div className="bg-red-900/30 px-4 py-2 text-red-400 font-bold text-xs uppercase tracking-widest text-center border-b border-red-900/30">Bad Architecture</div>
                      <div className="p-6 font-mono text-sm text-gray-300 space-y-3">
                        <p className="text-gray-500">// Reads header dynamically</p>
                        <p>const alg = token.header.alg;</p>
                        <p className="text-red-400 font-bold mt-2">verify(token, secret, alg);</p>
                      </div>
                    </div>
                    <div className="bg-green-950/20 border border-green-900/30 rounded-xl overflow-hidden">
                      <div className="bg-green-900/30 px-4 py-2 text-green-400 font-bold text-xs uppercase tracking-widest text-center border-b border-green-900/30">Good Architecture</div>
                      <div className="p-6 font-mono text-sm text-gray-300 space-y-3">
                        <p className="text-gray-500">// Hardcoded by server</p>
                        <p>const alg = "HS256";</p>
                        <p className="text-green-400 font-bold mt-2">verify(token, secret, alg);</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 5: Hacker Memory */}
                {explainStep === 4 && (
                  <div className="animate-fade-in flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
                    <div className="w-full bg-[#18181b] border border-gray-800 rounded-xl p-8 text-center shadow-lg">
                      <p className="text-white font-bold text-xl mb-4 leading-tight">Server trusted the client's security decision.</p>
                      <p className="text-red-400 text-sm font-bold uppercase tracking-widest">Never let users choose security logic.</p>
                    </div>
                    
                    <button 
                      onClick={() => setScene('VERIFY')} 
                      className="mt-4 w-full bg-white text-black font-black py-3.5 rounded-lg hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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
          
          {/* LEARNING JOURNEY TIMELINE (Backend-driven) */}
          <div className="bg-[#111113] rounded-xl shadow-xl border border-gray-800 overflow-hidden flex flex-col flex-1">
            <div className="bg-[#18181b] px-5 py-4 border-b border-gray-800">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Learning Journey</span>
            </div>
            <div className="p-6 bg-[#09090b] flex-1">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-800 before:via-gray-800 before:to-transparent">
                
                {/* Step 1: Login */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 1 ? 'border-gray-500 text-gray-400' : 'border-gray-800'}`}>
                    {currentStep >= 1 && <span aria-hidden="true" className="text-[10px]">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-bold text-gray-300">Login</p>
                  </div>
                </div>

                {/* Step 2: JWT Issued */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 2 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 2 ? 'border-gray-500 text-gray-400' : 'border-gray-800'}`}>
                     {currentStep >= 2 && <span aria-hidden="true" className="text-[10px]">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-bold text-gray-300">JWT Issued</p>
                  </div>
                </div>

                {/* Step 3: Header Modified */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 3 ? 'border-red-500 bg-red-900/20 text-red-400' : 'border-gray-800'}`}>
                     {currentStep >= 3 && <span aria-hidden="true" className="text-[10px]">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-bold text-red-300">Header Modified</p>
                  </div>
                </div>

                {/* Step 4: Signature Removed */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 4 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 4 ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-gray-800'}`}>
                    {currentStep >= 4 && <span aria-hidden="true" className="text-[10px]">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-bold text-blue-300">Signature Removed</p>
                  </div>
                </div>

                {/* Step 5: Prediction */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 5 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 5 ? 'border-purple-500 bg-purple-900/20 text-purple-400' : 'border-gray-800'}`}>
                    {currentStep >= 5 && <span aria-hidden="true" className="text-[10px]">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-bold text-purple-300">Prediction Recorded</p>
                  </div>
                </div>

                {/* Step 6: Request Forwarded */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 6 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 6 ? 'border-gray-400 text-gray-300' : 'border-gray-800'}`}>
                    {currentStep >= 6 && <span aria-hidden="true" className="text-[10px]">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-bold text-gray-300">Request Sent</p>
                  </div>
                </div>

                {/* Step 7: Verification Skipped */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 7 ? 'opacity-100 delay-300' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 7 ? 'border-yellow-500 bg-yellow-900/20 text-yellow-400' : 'border-gray-800'}`}>
                    {currentStep >= 7 && <span className="text-[10px] font-black" aria-hidden="true">!</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-black text-yellow-500 tracking-wide">Verification Skipped</p>
                  </div>
                </div>

                {/* Step 8: Admin Access */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 8 ? 'opacity-100 delay-500' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#09090b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 8 ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-gray-800'}`}>
                    {currentStep >= 8 && <span className="text-[10px] font-black" aria-hidden="true">🔓</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#18181b] p-2.5 rounded-lg border border-gray-800 text-sm">
                    <p className="font-black text-green-400 tracking-wide">Admin Access</p>
                  </div>
                </div>

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
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'broken_crypto' ? 'bg-[#18181b] border-gray-700' : 'border-gray-800 hover:bg-[#18181b]'}`}>
                  <input type="radio" name="quiz" value="broken_crypto" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'broken_crypto'} className="mr-3" />
                  <span className="text-gray-300">JWT encryption was broken.</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'payload_admin' ? 'bg-[#18181b] border-gray-700' : 'border-gray-800 hover:bg-[#18181b]'}`}>
                  <input type="radio" name="quiz" value="payload_admin" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'payload_admin'} className="mr-3" />
                  <span className="text-gray-300">The payload became admin.</span>
                </label>
                <label className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'server_trusted_client' ? 'bg-blue-900/20 border-blue-500/50' : 'border-gray-800 hover:bg-[#18181b]'}`}>
                  <input type="radio" name="quiz" value="server_trusted_client" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'server_trusted_client'} className="mr-3 mt-1" />
                  <div>
                    <span className="text-white font-medium block">Server trusted client-controlled verification settings.</span>
                  </div>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'no_security' ? 'bg-[#18181b] border-gray-700' : 'border-gray-800 hover:bg-[#18181b]'}`}>
                  <input type="radio" name="quiz" value="no_security" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'no_security'} className="mr-3" />
                  <span className="text-gray-300">JWT has no security.</span>
                </label>
              </div>
            </div>

            <button 
              onClick={runVerification} 
              disabled={isVerifying || !selectedAnswer || scene !== 'VERIFY'}
              className="w-full bg-white hover:bg-gray-200 text-black font-black py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed mt-auto relative z-10"
            >
              {isVerifying ? "Verifying..." : "Claim Flag"}
            </button>
          </div>

        </div>
      </div>

      {/* 🏆 FINAL FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-[#09090b]/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#111113] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-800">
            <div className="bg-gray-900 p-6 text-center border-b border-gray-800">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">Algorithm Confusion</h2>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="bg-[#09090b] p-4 rounded-lg border border-gray-800 font-mono text-green-400 font-black text-lg select-all shadow-inner">
                  {flag}
                </div>
              </div>

              <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-6 mb-8 text-center shadow-lg">
                <p className="text-white font-bold text-lg leading-tight mb-2">Server trusted the client's security decision.</p>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Never let users choose security logic.</p>
              </div>

              <a href="https://forms.gle/placeholder" target="_blank" rel="noreferrer" className="block w-full bg-white text-black text-center font-bold py-3.5 rounded-lg hover:bg-gray-200 transition shadow-lg">
                Submit Flag
              </a>
              <button onClick={() => setShowFlagModal(false)} className="block w-full text-center text-gray-500 font-bold py-3 mt-3 hover:text-gray-300 transition">
                Return to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}