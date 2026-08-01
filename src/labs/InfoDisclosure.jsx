import { useState, useEffect } from 'react';

export default function InfoDisclosure() {
  // Global Lab State
  const [labState, setLabState] = useState(null);
  
  // Scene Management
  const [scene, setScene] = useState('LANDING'); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Interactive Request State
  const [jsonBody, setJsonBody] = useState('{\n  "name": "Akash",\n  "preferences": {}\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Clue & Dashboard Animation States
  const [showClueHighlight, setShowClueHighlight] = useState(false);
  const [showClueButton, setShowClueButton] = useState(false);
  const [showWaitSubtitle, setShowWaitSubtitle] = useState(false);
  const [liveRequests, setLiveRequests] = useState(23);
  
  // Cinematic Animations
  const [explainStep, setExplainStep] = useState(0);
  const [slide3Anim, setSlide3Anim] = useState(0);
  const [slide5Anim, setSlide5Anim] = useState(0);
  
  // Quiz & Verification
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchState();
  }, []);

  // Clue Highlight Delay & Button Delay
  useEffect(() => {
    if (scene === 'ERROR') {
      const t1 = setTimeout(async () => {
        setShowClueHighlight(true);
        await fetch("/api/info-disclosure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'REVEAL_CLUE' })
        });
        await fetchState();
      }, 2500); 
      
      const t2 = setTimeout(() => setShowClueButton(true), 3000); 
      
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setShowClueHighlight(false);
      setShowClueButton(false);
    }
  }, [scene]);

  // Live Requests Dashboard Animation
  useEffect(() => {
    if (scene === 'DASHBOARD') {
      const interval = setInterval(() => {
        setLiveRequests(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [scene]);

  // Slide 3 Progressive Animation
  useEffect(() => {
    if (scene === 'EXPLAIN' && explainStep === 2) {
      setSlide3Anim(0);
      const t1 = setTimeout(() => setSlide3Anim(1), 500);
      const t2 = setTimeout(() => setSlide3Anim(2), 1000);
      const t3 = setTimeout(() => setSlide3Anim(3), 1500);
      const t4 = setTimeout(() => setSlide3Anim(4), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [scene, explainStep]);

  // Slide 5 Progressive Animation
  useEffect(() => {
    if (scene === 'EXPLAIN' && explainStep === 4) {
      setSlide5Anim(0);
      const t1 = setTimeout(() => setSlide5Anim(1), 400);  // Good Header
      const t2 = setTimeout(() => setSlide5Anim(2), 1200); // Good Content
      const t3 = setTimeout(() => setSlide5Anim(3), 2200); // Bad Header
      const t4 = setTimeout(() => setSlide5Anim(4), 3000); // Bad Content
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [scene, explainStep]);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/info-disclosure");
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
    await fetch("/api/info-disclosure", { method: "DELETE" });
    
    setScene('LANDING');
    setJsonBody('{\n  "name": "Akash",\n  "preferences": {}\n}');
    setLiveRequests(23); // Reset dashboard counter
    setExplainStep(0);
    setSlide3Anim(0);
    setSlide5Anim(0);
    setSelectedAnswer("");
    await fetchState();

    setTimeout(() => setIsResetting(false), 400);
  };

  // --- SCENE ACTIONS ---

  const handleLoadProfile = async () => {
    setIsTransitioning(true);
    await fetch("/api/info-disclosure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'VISIT_INSPECTOR' })
    });
    await fetchState();

    setTimeout(() => {
      setScene('INSPECT');
      setIsTransitioning(false);
    }, 400);
  };

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Check if learner successfully modified the payload to an array
      let isModified = false;
      try {
        if (Array.isArray(JSON.parse(jsonBody))) isModified = true;
      } catch(e) {}

      // 2. Truthfully update backend to show the Modified Step
      if (isModified) {
        await fetch("/api/info-disclosure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'MARK_MODIFIED' })
        });
        await fetchState();
      }

      // 3. Submit profile (Backend handles the 400ms delay internally before returning Error)
      const res = await fetch("/api/info-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'SUBMIT_PROFILE', payload: jsonBody })
      });
      const data = await res.json();
      await fetchState();

      setTimeout(() => {
        setIsSubmitting(false);
        if (data.error && data.type === 'VerboseError') {
          setScene('ERROR');
        } else if (data.error) {
          showToast("Invalid JSON syntax.", "error");
        } else {
          // Silent reload, natural behavior
          setJsonBody('{\n  "name": "Akash",\n  "preferences": {}\n}');
        }
      }, 0); 
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleFollowBreadcrumb = () => {
    setScene('WAIT_OVERLAY');
    setShowWaitSubtitle(false);
    
    // The cinematic psychological pause
    setTimeout(() => setShowWaitSubtitle(true), 300);

    setTimeout(async () => {
      setIsTransitioning(true);
      await fetch("/api/info-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'FOLLOW_BREADCRUMB' })
      });
      await fetchState();
  
      setTimeout(() => {
        setScene('DASHBOARD');
        setIsTransitioning(false);
      }, 400);
    }, 1500);
  };

  const startExplanation = async () => {
    setScene('EXPLAIN');
    await fetch("/api/info-disclosure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'BEGIN_EXPLANATION' })
    });
    await fetchState();
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/info-disclosure?action=verify");
      const data = await res.json();
      if (data.complete && selectedAnswer === "unnecessary_info") {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        showToast("Verification failed. Make sure to select the most technically correct answer.", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const currentStep = labState?.timelineStep || 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900 pb-10 overflow-hidden relative">
      
      {/* PREMIUM TOAST */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className={`px-6 py-3 rounded-full shadow-lg font-bold text-sm ${toast.type === 'error' ? 'bg-red-900 text-red-100 border border-red-700' : 'bg-gray-900 text-white border border-gray-700'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* RESET OVERLAY */}
      {isResetting && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <h2 className="text-gray-900 text-lg font-bold tracking-widest uppercase">Resetting Lab...</h2>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hunter Labs</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Day 14: Information Disclosure</p>
          </div>
          <button onClick={resetLab} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded-lg transition">
            Reset Lab
          </button>
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 md:p-6 gap-8 flex-1 mt-4 relative">
        
        {/* LEFT PANE */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative">
          
          {/* SCENE 1: LANDING PAGE */}
          {scene === 'LANDING' && (
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md mx-auto w-full transition-opacity duration-300 flex flex-col items-center justify-center min-h-[400px] ${isTransitioning ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 text-3xl">👤</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Portal</h2>
              <p className="text-gray-500 text-sm mb-8 text-center">Access your profile and preferences safely.</p>
              
              <button 
                onClick={handleLoadProfile}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
              >
                Load Profile
              </button>
            </div>
          )}

          {/* SCENE 2: INTERACTIVE REQUEST INSPECTOR */}
          {(scene === 'INSPECT') && (
            <div className="bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-800 overflow-hidden flex flex-col animate-fade-in-up min-h-[400px]">
              <div className="bg-[#2d2d2d] px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Request Inspector
                </span>
                <span className="text-xs text-gray-500">Try changing the request.</span>
              </div>
              
              <div className="p-6 font-mono text-sm leading-relaxed bg-[#1e1e1e] text-gray-300 flex-1">
                <span className="text-pink-400">POST</span> <span className="text-gray-100">/api/profile</span> HTTP/1.1<br/>
                Host: api.vertex.local<br/>
                Content-Type: application/json<br/>
                <br/>
                <div className="relative group">
                  <div className="absolute -top-3 left-0 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest z-10 opacity-0 group-hover:opacity-100 transition-opacity">Editable JSON</div>
                  <textarea 
                    value={jsonBody}
                    onChange={(e) => setJsonBody(e.target.value)}
                    className="w-full h-32 bg-[#252526] text-green-300 border border-gray-700 focus:border-blue-500 rounded p-3 focus:outline-none resize-none text-base md:text-sm"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="bg-[#111] p-5 border-t border-gray-800 flex justify-between items-center">
                {isSubmitting ? (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-mono">Awaiting Response...</span>
                  </div>
                ) : <div></div>}
                
                <button 
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-black px-6 py-2 rounded-lg transition shadow-lg text-sm flex items-center gap-2"
                >
                  Submit Request ➔
                </button>
              </div>
            </div>
          )}

          {/* SCENE 3: THE VERBOSE ERROR & BREADCRUMB */}
          {scene === 'ERROR' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-fade-in-up min-h-[450px]">
              <div className="bg-red-50 px-5 py-3 border-b border-red-100 flex items-center gap-3">
                <span className="text-red-500 text-lg">⚠</span>
                <span className="text-sm font-bold text-red-800">500 Internal Server Error</span>
              </div>
              
              <div className="p-8 font-mono text-sm leading-relaxed text-gray-800 bg-gray-50 flex-1 relative transition-colors duration-1000 overflow-hidden">
                {/* Visual Blurring of non-reference data to direct eye tracking */}
                <div className={`transition-all duration-1000 ${showClueHighlight ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}>
                  <h3 className="text-red-600 font-bold text-lg mb-4 break-words">TypeError: profile.name.trim is not a function</h3>
                  <div className="text-gray-500 ml-4 mb-6 space-y-1 break-all whitespace-pre-wrap">
                    <p>at ProfileController.load (/var/www/app/controllers/profile.js:42:15)</p>
                    <p>at authMiddleware (/var/www/app/middleware/auth.js:22:7)</p>
                    <p>at Layer.handle [as handle_request] (/var/www/app/node_modules/express/lib/router/layer.js:95:5)</p>
                    <p>at next (/var/www/app/node_modules/express/lib/router/route.js:137:13)</p>
                    <p>at Route.dispatch (/var/www/app/routes/profile.js:112:3)</p>
                  </div>
                  
                  <div className="space-y-1 mt-6 border-t border-gray-200 pt-6">
                    <p><span className="font-bold text-gray-700">Environment:</span> Production</p>
                    <p><span className="font-bold text-gray-700">Node:</span> v20.5.1</p>
                    <p><span className="font-bold text-gray-700">Framework:</span> Express 4.18.2</p>
                    <p><span className="font-bold text-gray-700">PID:</span> 18492</p>
                  </div>
                </div>

                {/* THE BREADCRUMB REVEAL - Naturally Embedded with flowing highlight */}
                <div className={`mt-6 pt-6 border-t border-gray-200 transition-all duration-1000 ease-in-out origin-left ${showClueHighlight ? 'scale-[1.03] shadow-[0_0_25px_rgba(6,182,212,0.15)] bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 absolute bottom-8 w-[calc(100%-4rem)]' : ''}`}>
                  <div className={`space-y-1 ${showClueHighlight ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}>
                    <p className={`font-bold transition-colors ${showClueHighlight ? 'text-cyan-900' : 'text-gray-700'}`}>Reference:</p>
                    <p className="text-gray-600 break-words">GET /v2/api/admin-debug-console</p>
                    <p className="text-gray-500">See controller: AdminDebugController.js</p>
                  </div>
                  
                  {showClueButton && (
                    <button onClick={handleFollowBreadcrumb} className="mt-5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded shadow-md uppercase tracking-widest animate-fade-in-up flex items-center gap-2">
                      Follow Clue 
                      <span className="inline-block animate-[bounceRight_1s_infinite]">➔</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PSYCHOLOGICAL PAUSE OVERLAY */}
          {scene === 'WAIT_OVERLAY' && (
            <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center border-2 border-gray-800">
              <h1 className="text-5xl font-black text-white mb-4">Wait...</h1>
              {showWaitSubtitle && (
                <p className="text-2xl text-cyan-400 font-medium animate-fade-in-up">This URL wasn't supposed to be public.</p>
              )}
            </div>
          )}

          {/* SCENE 4: SENSITIVE INTERNAL DASHBOARD */}
          {scene === 'DASHBOARD' && (
            <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-fade-in-up min-h-[450px] ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <h2 className="text-white font-bold tracking-wide">Admin Debug Console</h2>
                </div>
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Confidential</span>
              </div>
              
              <div className="p-8 bg-gray-50 flex-1 grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">API Version</p>
                  <p className="text-gray-900 font-mono font-bold text-lg">v2.3.1</p>
                </div>
                
                {/* Live Requests Animated Widget */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span> Live Requests
                  </p>
                  <p className="text-blue-600 font-mono font-bold text-2xl transition-all duration-300">{liveRequests}/s</p>
                </div>

                {/* Additional Realistic Widget */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Debug Mode</p>
                  <p className="text-red-600 font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span> Enabled
                  </p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative overflow-hidden group">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Internal Endpoints</p>
                  <div className="flex flex-wrap gap-2 filter blur-[1.5px] select-none transition-all duration-300 hover:blur-[1px]">
                    <span className="text-gray-600 font-mono text-sm">/admin</span>
                    <span className="text-gray-600 font-mono text-sm">/metrics</span>
                    <span className="text-gray-600 font-mono text-sm">/jobs</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm col-span-2">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Feature Flags</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded text-xs font-bold font-mono">payments_v2</span>
                    <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded text-xs font-bold font-mono">new_checkout</span>
                    <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-xs font-bold font-mono">internal_beta</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-t border-gray-200 p-5 flex justify-center">
                <button onClick={startExplanation} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2">
                  Why did this happen? ➔
                </button>
              </div>
            </div>
          )}

          {/* SCENE 5: CINEMATIC EXPLANATION */}
          {(scene === 'EXPLAIN' || scene === 'VERIFY' || scene === 'COMPLETE') && (
            <div className="bg-[#111] rounded-2xl shadow-2xl border border-gray-800 p-10 flex flex-col justify-center animate-fade-in min-h-[450px]">
              
              {/* Controls */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Logic Breakdown</span>
                <div className="flex gap-2">
                  <button onClick={() => setExplainStep(Math.max(0, explainStep - 1))} disabled={explainStep === 0} className="text-gray-400 hover:text-white disabled:opacity-30">◀</button>
                  <span className="text-gray-500 text-sm font-mono"><span className="text-blue-400 font-bold">{explainStep + 1}</span> / 6</span>
                  <button onClick={() => setExplainStep(Math.min(5, explainStep + 1))} disabled={explainStep === 5} className="text-gray-400 hover:text-white disabled:opacity-30">▶</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center text-center px-4">
                
                {/* SLIDE 1: Developer Expected */}
                {explainStep === 0 && (
                  <div className="animate-fade-in space-y-6">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Developer Expected</p>
                    <div className="flex justify-center items-center gap-6 pt-4 text-sm font-mono text-gray-300">
                      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg">Valid Request</div>
                      <span className="text-gray-500 text-2xl">➔</span>
                      <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-xl shadow-lg font-bold">Valid Response</div>
                    </div>
                  </div>
                )}

                {/* SLIDE 2: Instead... */}
                {explainStep === 1 && (
                  <div className="animate-fade-in space-y-6">
                    <p className="text-red-400 text-sm font-bold uppercase tracking-widest">Instead...</p>
                    <div className="flex justify-center items-center gap-6 pt-4 text-sm font-mono text-gray-300">
                      <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl shadow-lg font-bold">Unexpected Request</div>
                      <span className="text-gray-500 text-2xl">➔</span>
                      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg">Verbose Error</div>
                    </div>
                  </div>
                )}

                {/* SLIDE 3: Verbose Error */}
                {explainStep === 2 && (
                  <div className="animate-fade-in space-y-6">
                    <div className="flex justify-center items-center gap-6 text-sm font-mono text-gray-300 mb-8">
                      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg">Verbose Error</div>
                      <span className="text-gray-500 text-2xl">➔</span>
                      <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl shadow-lg font-bold">Extra Information</div>
                    </div>
                    <div className="flex justify-center gap-3">
                      {slide3Anim >= 1 && <span className="animate-fade-in-up bg-gray-800 text-gray-400 px-3 py-1 rounded text-xs font-mono">Framework</span>}
                      {slide3Anim >= 2 && <span className="animate-fade-in-up bg-gray-800 text-gray-400 px-3 py-1 rounded text-xs font-mono">Version</span>}
                      {slide3Anim >= 3 && <span className="animate-fade-in-up bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 px-3 py-1 rounded text-xs font-mono font-bold animate-[pulse_2s_ease-in-out_infinite]">Internal URL</span>}
                    </div>
                  </div>
                )}

                {/* SLIDE 4: Breadcrumb Effect */}
                {explainStep === 3 && (
                  <div className="animate-fade-in space-y-8">
                    <h3 className="text-3xl text-white font-black tracking-widest uppercase">The Breadcrumb Effect</h3>
                    <div className="flex justify-center items-center gap-4 text-sm font-mono text-gray-300">
                      <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg">One Clue</div>
                      <span className="text-gray-500">➔</span>
                      <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg">Next Clue</div>
                      <span className="text-gray-500">➔</span>
                      <div className="bg-blue-900/30 border border-blue-500/50 text-blue-400 font-bold px-4 py-2 rounded-lg">More Information</div>
                    </div>
                  </div>
                )}

                {/* SLIDE 5: Sequential Reveal Good vs Bad */}
                {explainStep === 4 && (
                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className={`bg-green-950/20 border border-green-900/30 rounded-xl overflow-hidden transition-opacity duration-300 ${slide5Anim >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="bg-green-900/30 px-4 py-2 text-green-400 font-bold text-xs uppercase tracking-widest text-center border-b border-green-900/30">Good Error Handling</div>
                      <div className={`p-6 font-mono text-sm text-gray-300 space-y-3 transition-opacity duration-500 ${slide5Anim >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-white">Something went wrong.</p>
                        <p className="text-gray-500 mt-4">Request ID:</p>
                        <p className="text-green-400 font-bold">6F82A-991B</p>
                      </div>
                    </div>
                    <div className={`bg-red-950/20 border border-red-900/30 rounded-xl overflow-hidden transition-opacity duration-300 ${slide5Anim >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="bg-red-900/30 px-4 py-2 text-red-400 font-bold text-xs uppercase tracking-widest text-center border-b border-red-900/30">Bad Error Handling</div>
                      <div className={`p-6 font-mono text-sm text-gray-400 space-y-2 transition-opacity duration-500 ${slide5Anim >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-white">Express 4.18.2 Error</p>
                        <p>Stack Trace: /var/www/app...</p>
                        <p className="text-red-400 font-bold">Admin Debug Console</p>
                        <p>Filesystem Path</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 6: Hacker Memory */}
                {explainStep === 5 && (
                  <div className="animate-fade-in flex flex-col gap-8 items-center w-full max-w-md mx-auto">
                    <div className="flex items-center gap-2 font-mono text-sm text-gray-400">
                      <span className="text-red-400">Unexpected Errors</span> <span className="text-gray-600">➔</span> <span className="text-yellow-400">Unexpected Clues</span> <span className="text-gray-600">➔</span> <span className="text-white font-bold">Unexpected Attack Surface</span>
                    </div>
                    
                    <div className="w-full bg-gray-800 border border-gray-700 rounded-xl p-6 text-center shadow-lg">
                      <p className="text-white font-bold text-lg">The first clue is rarely the final bug.</p>
                    </div>
                    
                    <button 
                      onClick={() => setScene('VERIFY')} 
                      className="mt-2 w-full bg-white text-black font-black py-3 rounded-lg hover:bg-gray-200 transition shadow-lg"
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
          
          {/* LEARNING JOURNEY TIMELINE (Driven completely by authoritative backend state) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Learning Journey</span>
            </div>
            <div className="p-6 bg-white flex-1">
              <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent">
                
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 1 ? 'border-gray-500 text-gray-500' : 'border-gray-300'}`}>
                    {currentStep >= 1 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Normal Request</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 2 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 2 ? 'border-yellow-500 text-yellow-500' : 'border-gray-300'}`}>
                     {currentStep >= 2 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Request Modified</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 3 ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300'}`}>
                     {currentStep >= 3 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Verbose Error</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 4 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 4 ? 'border-cyan-500 bg-cyan-50 text-cyan-600' : 'border-gray-300'}`}>
                    {currentStep >= 4 && <span aria-hidden="true">🔎</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-cyan-50 p-2.5 rounded-lg border border-cyan-200 text-sm shadow-sm">
                    <p className="font-bold text-cyan-900">Hidden Clue Found</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 5 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 5 ? 'border-blue-500 text-blue-500' : 'border-gray-300'}`}>
                    {currentStep >= 5 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Follow Clue</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 6 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 6 ? 'border-green-500 bg-green-100 text-green-600' : 'border-gray-300'}`}>
                    {currentStep >= 6 && <span className="text-[10px] font-black" aria-hidden="true">🔓</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-green-50 p-2.5 rounded-lg border border-green-200 text-sm shadow-sm">
                    <p className="font-black text-green-800 tracking-wide">Sensitive Information</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* HACKER CONSOLE */}
          <div className="bg-[#111] rounded-xl p-6 shadow-xl border border-gray-800 flex flex-col relative overflow-hidden mt-auto">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-10h2v8h-2V7z"></path></svg>
            </div>
            
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hacker Console
            </h3>
            
            <div className="mb-6 relative z-10">
              <p className="text-gray-300 text-sm font-medium mb-4">Why was the verbose error a vulnerability?</p>
              
              <div className="space-y-3 text-sm">
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'error_is_vuln' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="error_is_vuln" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'error_is_vuln'} className="mr-3" />
                  <span className="text-gray-300">The error itself is the vulnerability</span>
                </label>
                <label className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'unnecessary_info' ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="unnecessary_info" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'unnecessary_info'} className="mr-3 mt-1" />
                  <div>
                    <span className="text-white font-medium block">The server revealed more information than users needed</span>
                  </div>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'server_crash' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="server_crash" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'server_crash'} className="mr-3" />
                  <span className="text-gray-300">The application crashed</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'browser_modified' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="browser_modified" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'browser_modified'} className="mr-3" />
                  <span className="text-gray-300">The browser modified the response</span>
                </label>
              </div>
            </div>

            <button 
              onClick={runVerification} 
              disabled={isVerifying || !selectedAnswer || scene !== 'VERIFY'}
              className="w-full bg-white hover:bg-gray-200 text-black font-black py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto relative z-10"
            >
              {isVerifying ? "Verifying..." : "Claim Flag"}
            </button>
          </div>

        </div>
      </div>

      {/* 🏆 FINAL FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-black p-6 text-center border-b border-gray-800">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">Information Disclosure</h2>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-black font-black text-lg select-all shadow-inner">
                  {flag}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
                <p className="text-gray-900 font-black mb-3 flex items-center text-sm uppercase tracking-wider">
                  <span className="mr-2 text-lg">🧠</span> Hacker Memory
                </p>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  Errors don't just tell you something went wrong. They often tell you where to look next.<br/><br/>
                  <strong className="text-gray-900">The first clue is rarely the final bug.</strong>
                </p>
              </div>

              <a href="https://forms.gle/placeholder" target="_blank" rel="noreferrer" className="block w-full bg-black text-white text-center font-bold py-3 rounded-lg hover:bg-gray-800 transition">
                Submit Flag
              </a>
              <button onClick={() => setShowFlagModal(false)} className="block w-full text-center text-gray-500 font-bold py-3 mt-2 hover:text-gray-800 transition">
                Return to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}