import { useState, useEffect } from 'react';

export default function SubdomainTakeover() {
  // Global Lab State
  const [labState, setLabState] = useState(null);
  
  // Clean State Machine matching the backend
  const [scene, setScene] = useState('DISCOVER'); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Claim Process Flow: 'idle' | 'checking' | 'verified' | 'connected'
  const [claimStatus, setClaimStatus] = useState('idle');
  
  // Cinematic Animations
  const [infraAnim, setInfraAnim] = useState(0);
  const [successAnim, setSuccessAnim] = useState(0);
  const [explainStep, setExplainStep] = useState(0);
  const [slide3Anim, setSlide3Anim] = useState(0);
  
  // Quiz & Verification
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchState();
  }, []);

  // Infrastructure Viewer Animation (Dynamic based on resource existence)
  useEffect(() => {
    if (scene === 'DISCOVER' || scene === 'SUCCESS') {
      setInfraAnim(0);
      const t1 = setTimeout(() => setInfraAnim(1), 400);  // Browser
      const t2 = setTimeout(() => setInfraAnim(2), 1000); // DNS Lookup
      const t3 = setTimeout(() => setInfraAnim(3), 1600); // Hosting Provider
      const t4 = setTimeout(() => setInfraAnim(4), 2200); // Response Rendered
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [scene]);

  // Slide 3 Mini-Animation Sequence
  useEffect(() => {
    if (scene === 'EXPLAIN' && explainStep === 2) {
      setSlide3Anim(0);
      const t1 = setTimeout(() => setSlide3Anim(1), 800);  // DNS -> Provider -> 404
      const t2 = setTimeout(() => setSlide3Anim(2), 2500); // Empty Land
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [scene, explainStep]);

  // Handle Emotional Payoff Freeze
  useEffect(() => {
    if (scene === 'SUCCESS') {
      const t1 = setTimeout(() => setSuccessAnim(1), 1500); // "Wait..."
      const t2 = setTimeout(() => setSuccessAnim(2), 2500); // "Another owner..."
      // Note: Auto-transition removed. The learner now clicks a button to proceed.
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [scene]);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/subdomain-takeover");
      const data = await res.json();
      setLabState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetLab = async () => {
    setIsResetting(true);
    await fetch("/api/subdomain-takeover", { method: "DELETE" });
    
    setScene('DISCOVER');
    setClaimStatus('idle');
    setSuccessAnim(0);
    setExplainStep(0);
    setSlide3Anim(0);
    setInfraAnim(0);
    setSelectedAnswer("");
    await fetchState();

    setTimeout(() => setIsResetting(false), 500);
  };

  // --- SCENE ACTIONS ---

  const handleInspectDNS = async () => {
    setIsTransitioning(true);
    await fetch("/api/subdomain-takeover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'INSPECT_DNS' })
    });
    await fetchState();

    setTimeout(() => {
      setScene('INSPECT_DNS');
      setIsTransitioning(false);
    }, 400);
  };

  const handleClaimDomain = async (e) => {
    e.preventDefault();
    setClaimStatus('checking');
    setScene('VERIFY_OWNERSHIP'); // Enter the ownership flow
    
    await fetch("/api/subdomain-takeover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'CLAIM_DOMAIN' })
    });
    await fetchState();

    // Cinematic Claim Sequence
    setTimeout(() => {
      setClaimStatus('verified');
      setTimeout(async () => {
        setClaimStatus('connected');
        await fetch("/api/subdomain-takeover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'VERIFY_OWNERSHIP' })
        });
        await fetchState();
        
        setTimeout(async () => {
          setIsTransitioning(true);
          await fetch("/api/subdomain-takeover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: 'WEBSITE_ACTIVE' })
          });
          await fetchState();
          
          setTimeout(() => {
            setScene('SUCCESS');
            setIsTransitioning(false);
          }, 600);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const startExplanation = async () => {
    setScene('EXPLAIN');
    await fetch("/api/subdomain-takeover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'BEGIN_EXPLANATION' })
    });
    await fetchState();
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/subdomain-takeover?action=verify");
      const data = await res.json();
      if (data.complete && selectedAnswer === "developer_dns") {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        alert("Verification failed. Review the explanation carefully.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const currentStep = labState?.timelineStep || 0;
  const infrastructure = labState?.infrastructure || {};

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900 pb-10 overflow-hidden relative">
      
      {/* RESET OVERLAY */}
      {isResetting && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <h2 className="text-gray-900 text-lg font-bold tracking-widest uppercase">Restoring DNS...</h2>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hunter Labs</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Day 13: Subdomain Takeover</p>
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
          
          {/* SCENE: DISCOVER (404 Page) & SUCCESS */}
          {(scene === 'DISCOVER' || scene === 'SUCCESS') && (
            <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}>
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-gray-300 rounded-md px-4 py-1 text-sm text-gray-600 font-mono flex items-center gap-2 w-2/3 shadow-sm transition-all">
                    <span className="text-gray-400">🔒</span> blog.vertex.local
                  </div>
                </div>
              </div>
              
              <div className="p-10 text-center min-h-[400px] flex flex-col items-center justify-center bg-gray-50">
                {scene === 'DISCOVER' && (
                  <div className="animate-fade-in flex flex-col items-center">
                    <h2 className="text-5xl font-black text-gray-800 mb-3">404</h2>
                    <p className="text-gray-600 font-bold text-xl mb-4">Site Not Found.</p>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-10">The hosting provider could not locate the requested resource. The site may have been deleted.</p>
                    
                    <button onClick={handleInspectDNS} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg text-sm flex items-center gap-2">
                      Why is it showing this? ➔
                    </button>
                  </div>
                )}
                
                {scene === 'SUCCESS' && (
                  <div className="animate-fade-in bg-white border border-green-200 shadow-xl rounded-2xl p-10 w-full max-w-md transform scale-105">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👋</div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome</h2>
                    <p className="text-green-600 font-bold mb-4">Subdomain Successfully Claimed</p>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded">Safe Lab Demonstration</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCENE: DNS INSPECTOR */}
          {(scene === 'INSPECT_DNS') && (
            <div className="bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-800 overflow-hidden flex flex-col animate-fade-in-up min-h-[400px]">
              <div className="bg-[#2d2d2d] px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> DNS Inspector
                </span>
              </div>
              
              <div className="p-8 flex flex-col items-center justify-center flex-1">
                <p className="text-gray-400 text-sm mb-8 text-center max-w-sm leading-relaxed">
                  The company deleted their website, but left the DNS record pointing to their hosting provider.
                </p>
                
                <div className="flex items-center gap-4 text-sm font-mono w-full justify-center">
                  <div className="bg-gray-800 border border-gray-600 px-4 py-3 rounded-lg text-white">
                    blog.vertex.local
                  </div>
                  <div className="text-gray-500 font-bold text-xs uppercase">{infrastructure.dnsRecord?.type || 'CNAME'} ➔</div>
                  <div className="bg-blue-900/30 border border-blue-500/50 px-4 py-3 rounded-lg text-blue-400 font-bold relative group">
                    {infrastructure.dnsRecord?.target || 'vertex.github.io'}
                    <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse shadow-lg">Vulnerable</span>
                  </div>
                </div>

                {/* The Missing Puzzle Piece */}
                <div className="mt-12 bg-black/50 border border-gray-700 p-5 rounded-xl text-center animate-fade-in-up w-full max-w-sm">
                  <p className="text-gray-400 text-sm font-medium">Who owns <strong className="text-white">{infrastructure.dnsRecord?.target || 'vertex.github.io'}</strong>?</p>
                  <p className="text-red-400 font-black text-xl mt-2 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute"></span>
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    The previous project no longer exists.
                  </p>
                </div>
              </div>

              <div className="bg-[#111] p-5 border-t border-gray-800 flex justify-end">
                <button 
                  onClick={() => setScene('CLAIM')}
                  className="bg-white hover:bg-gray-200 text-black font-black px-6 py-2 rounded-lg transition shadow-lg text-sm flex items-center gap-2"
                >
                  Exploit: Claim Domain ➔
                </button>
              </div>
            </div>
          )}

          {/* SCENE: CLAIM DOMAIN & VERIFY OWNERSHIP */}
          {(scene === 'CLAIM' || scene === 'VERIFY_OWNERSHIP') && (
            <div className={`bg-gray-50 rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-fade-in-up min-h-[400px]`}>
              <div className="bg-gray-900 px-5 py-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-10h2v8h-2V7z"></path></svg>
                <span className="text-white font-bold text-sm tracking-wide">Hosting Provider Console</span>
              </div>
              
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center bg-white relative">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Attach Custom Domain</h3>
                
                <div className="w-full max-w-sm text-left relative z-10">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Address</label>
                  <input type="text" disabled value="blog.vertex.local" className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900 font-mono text-sm mb-6 shadow-sm" />
                  
                  {claimStatus === 'idle' && (
                    <>
                      <button 
                        onClick={handleClaimDomain}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md mb-3"
                      >
                        Connect Domain
                      </button>
                      <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                        * DNS propagation simulated instantly for learning purposes
                      </p>
                    </>
                  )}

                  {claimStatus !== 'idle' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        {claimStatus === 'checking' ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <div className="text-green-500 font-bold">✔</div>}
                        <span className={`text-sm font-bold ${claimStatus === 'checking' ? 'text-blue-600' : 'text-gray-700'}`}>Checking DNS Records...</span>
                      </div>
                      
                      <div className={`flex items-center gap-3 transition-opacity duration-300 ${claimStatus === 'checking' ? 'opacity-30' : 'opacity-100'}`}>
                        {claimStatus === 'verified' ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : (claimStatus === 'connected' ? <div className="text-green-500 font-bold">✔</div> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>)}
                        <span className={`text-sm font-bold ${claimStatus === 'verified' ? 'text-blue-600' : (claimStatus === 'connected' ? 'text-gray-700' : 'text-gray-400')}`}>Verifying Ownership...</span>
                      </div>

                      <div className={`flex items-center gap-3 transition-opacity duration-300 ${claimStatus === 'connected' ? 'opacity-100' : 'opacity-30'}`}>
                        {claimStatus === 'connected' ? <div className="text-green-500 font-bold">✔</div> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}
                        <span className={`text-sm font-bold ${claimStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`}>Connected successfully</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EMOTIONAL PAYOFF OVERLAY (Shown over the Success Response) */}
          {scene === 'SUCCESS' && successAnim >= 1 && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center border-2 border-gray-200">
              <h1 className="text-5xl font-black text-gray-900 mb-4">Wait...</h1>
              {successAnim >= 2 && (
                <>
                  <p className="text-2xl text-blue-600 font-medium animate-fade-in-up mb-8">Another owner now controls the subdomain.</p>
                  <button onClick={startExplanation} className="animate-fade-in-up bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2">
                    Why did this happen? ➔
                  </button>
                </>
              )}
            </div>
          )}

          {/* SCENE: CINEMATIC EXPLANATION */}
          {(scene === 'EXPLAIN' || scene === 'VERIFY' || scene === 'COMPLETE') && (
            <div className="bg-[#111] rounded-2xl shadow-2xl border border-gray-800 p-10 flex flex-col justify-center animate-fade-in min-h-[400px]">
              
              {/* Controls */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Logic Breakdown</span>
                <div className="flex gap-2">
                  <button onClick={() => setExplainStep(Math.max(0, explainStep - 1))} disabled={explainStep === 0} className="text-gray-400 hover:text-white disabled:opacity-30">◀</button>
                  <span className="text-gray-500 text-sm font-mono">{explainStep + 1} / 6</span>
                  <button onClick={() => setExplainStep(Math.min(5, explainStep + 1))} disabled={explainStep === 5} className="text-gray-400 hover:text-white disabled:opacity-30">▶</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center text-center px-4">
                
                {/* SLIDE 1: Developer removed HOUSE */}
                {explainStep === 0 && (
                  <div className="animate-fade-in space-y-6">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Step 1</p>
                    <h3 className="text-2xl text-white font-medium">Developer removed the <span className="text-blue-400 font-bold">HOUSE</span></h3>
                    <div className="text-6xl pt-4 animate-fade-in-up">
                      <span className="opacity-20 grayscale line-through">🏡</span>
                    </div>
                    <p className="text-gray-500 text-sm">(The Hosting Provider resource was deleted)</p>
                  </div>
                )}

                {/* SLIDE 2: DNS remained ADDRESS */}
                {explainStep === 1 && (
                  <div className="animate-fade-in space-y-6">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Step 2</p>
                    <h3 className="text-2xl text-white font-medium">But DNS remained as the <span className="text-yellow-400 font-bold">ADDRESS</span></h3>
                    <div className="text-6xl pt-4 animate-fade-in-up">
                      <span>🪧</span>
                    </div>
                    <p className="text-gray-500 text-sm">({infrastructure.dnsRecord?.type || 'CNAME'} blog.vertex.local ➔ Hosting Provider)</p>
                  </div>
                )}

                {/* SLIDE 3: Internet follows Address to Empty Land */}
                {explainStep === 2 && (
                  <div className="animate-fade-in space-y-8">
                    <h3 className="text-2xl text-white font-medium">The Internet still follows the <span className="text-yellow-400 font-bold">ADDRESS</span></h3>
                    
                    {slide3Anim >= 1 && (
                      <div className="flex justify-center items-center gap-4 text-sm font-mono animate-fade-in-up bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                        <span className="bg-gray-800 px-3 py-2 rounded text-gray-300 border border-gray-700 shadow-sm">DNS</span>
                        <span className="text-gray-600">➔</span>
                        <span className="bg-gray-800 px-3 py-2 rounded text-gray-300 border border-gray-700 shadow-sm">Hosting Provider</span>
                        <span className="text-gray-600">➔</span>
                        <span className="text-red-400 font-bold px-2 py-1 bg-red-900/30 rounded border border-red-500/30">404 Not Found</span>
                      </div>
                    )}

                    {slide3Anim >= 2 && (
                      <div className="flex justify-center items-center gap-6 pt-2 text-4xl animate-fade-in-up">
                        <span>🪧</span>
                        <span className="text-gray-600 text-2xl">➔</span>
                        <span className="text-gray-700 text-2xl border-2 border-dashed border-gray-600 p-4 rounded-lg bg-gray-900">Empty Land</span>
                      </div>
                    )}
                  </div>
                )}

                {/* SLIDE 4: Someone builds New House */}
                {explainStep === 3 && (
                  <div className="animate-fade-in space-y-6">
                    <h3 className="text-2xl text-white font-medium">Someone builds a <span className="text-green-400 font-bold">NEW HOUSE</span> at the same address.</h3>
                    <div className="flex justify-center items-center gap-6 pt-4 text-4xl animate-fade-in-up">
                      <span>🪧</span>
                      <span className="text-gray-600 text-2xl">➔</span>
                      <span className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">🏢</span>
                    </div>
                    <p className="text-gray-500 text-sm">(Anyone can create a new resource matching the dangling DNS)</p>
                  </div>
                )}

                {/* SLIDE 5: Good vs Bad Process */}
                {explainStep === 4 && (
                  <div className="animate-fade-in grid grid-cols-2 gap-6 text-left">
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl overflow-hidden">
                      <div className="bg-red-900/30 px-4 py-2 text-red-400 font-bold text-xs uppercase tracking-widest text-center border-b border-red-900/30">Bad Process</div>
                      <div className="p-6 font-mono text-sm text-gray-300 space-y-3">
                        <p className="text-red-400">1. Delete Server</p>
                        <p className="text-gray-500">2. Done</p>
                      </div>
                    </div>
                    <div className="bg-green-950/20 border border-green-900/30 rounded-xl overflow-hidden">
                      <div className="bg-green-900/30 px-4 py-2 text-green-400 font-bold text-xs uppercase tracking-widest text-center border-b border-green-900/30">Good Process</div>
                      <div className="p-6 font-mono text-sm text-gray-300 space-y-3">
                        <p>1. Delete Server</p>
                        <p className="text-green-400 font-bold">2. Remove DNS Record</p>
                        <p className="text-gray-500">3. Done</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 6: Mental Model */}
                {explainStep === 5 && (
                  <div className="animate-fade-in flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
                    <h3 className="text-4xl font-black tracking-widest">
                      <span className="text-blue-400">HOUSE</span> <span className="text-gray-500 mx-2">≠</span> <span className="text-yellow-400">ADDRESS</span>
                    </h3>
                    <div className="w-full bg-gray-800 border border-gray-700 rounded-xl p-5 text-center shadow-lg">
                      <p className="text-white font-bold uppercase tracking-widest mb-2">Delete Both</p>
                      <p className="text-gray-400 text-sm font-mono">Server + DNS</p>
                    </div>
                    
                    <button 
                      onClick={() => setScene('VERIFY')} 
                      className="mt-4 w-full bg-white text-black font-black py-3 rounded-lg hover:bg-gray-200 transition shadow-lg"
                    >
                      Solve Lab
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANE: Infrastructure Viewer & Timeline & Console */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-40">
          
          {/* INFRASTRUCTURE VIEWER */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-800 overflow-hidden flex flex-col">
            <div className="bg-[#2d2d2d] px-5 py-3 border-b border-gray-700 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Infrastructure
              </span>
            </div>
            <div className="p-6 bg-[#1e1e1e] font-mono text-xs flex flex-col gap-3 text-center transition-all duration-300">
              <div className={`p-2 rounded border transition-all duration-500 ${infraAnim >= 1 ? 'border-blue-500 text-blue-400 bg-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-gray-700 text-gray-600 bg-black/20'}`}>
                Browser
              </div>
              <div className={`text-lg font-black transition-colors duration-500 ${infraAnim >= 2 ? 'text-gray-400' : 'text-gray-800'}`}>↓</div>
              <div className={`p-2 rounded border transition-all duration-500 ${infraAnim >= 2 ? 'border-yellow-500 text-yellow-400 bg-yellow-900/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'border-gray-700 text-gray-600 bg-black/20'}`}>
                DNS Lookup
              </div>
              <div className={`text-lg font-black transition-colors duration-500 ${infraAnim >= 3 ? 'text-gray-400' : 'text-gray-800'}`}>↓</div>
              <div className={`p-2 rounded border transition-all duration-500 ${infraAnim >= 3 ? 'border-purple-500 text-purple-400 bg-purple-900/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'border-gray-700 text-gray-600 bg-black/20'}`}>
                Hosting Provider
              </div>
              <div className={`text-lg font-black transition-colors duration-500 ${infraAnim >= 4 ? 'text-gray-400' : 'text-gray-800'}`}>↓</div>
              <div className={`p-2 rounded border transition-all duration-500 ${infraAnim >= 4 ? (scene === 'SUCCESS' ? 'border-green-500 text-green-400 bg-green-900/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-red-500 text-red-400 bg-red-900/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]') : 'border-gray-700 text-gray-600 bg-black/20'}`}>
                {infraAnim >= 4 ? (scene === 'SUCCESS' ? '200 OK Rendered' : '404 Not Found') : 'Response'}
              </div>
            </div>
          </div>

          {/* VALIDATION TIMELINE (Driven completely by backend state) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Learning Journey</span>
            </div>
            <div className="p-6 bg-white flex-1">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent">
                
                {/* Step 1: Visit Subdomain */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 1 ? 'border-blue-500 text-blue-500' : 'border-gray-300'}`}>
                    {currentStep >= 1 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Visit Subdomain</p>
                  </div>
                </div>

                {/* Step 2: DNS Record Exists */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 2 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 2 ? 'border-yellow-500 text-yellow-500' : 'border-gray-300'}`}>
                     {currentStep >= 2 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">DNS Record Exists</p>
                  </div>
                </div>

                {/* Step 3: Claim Domain */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 3 ? 'border-purple-500 bg-purple-50 text-purple-500' : 'border-gray-300'}`}>
                     {currentStep >= 3 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Claim Domain</p>
                  </div>
                </div>

                {/* Step 4: Verify Ownership */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 4 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 4 ? 'border-indigo-500 text-indigo-500' : 'border-gray-300'}`}>
                    {currentStep >= 4 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Verify Ownership</p>
                  </div>
                </div>

                {/* Step 5: Website Controlled */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 5 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 5 ? 'border-green-500 text-green-500 bg-green-50' : 'border-gray-300'}`}>
                    {currentStep >= 5 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Website Controlled</p>
                  </div>
                </div>

                {/* Step 6: Root Cause */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 6 ? 'opacity-100 delay-300' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 6 ? 'border-red-500 bg-red-100 text-red-600' : 'border-gray-300'}`}>
                    {currentStep >= 6 && <span className="text-[10px] font-black" aria-hidden="true">✖</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-red-50 p-2.5 rounded-lg border border-red-200 text-sm shadow-sm">
                    <p className="font-black text-red-700 tracking-wide">Root Cause</p>
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
              <p className="text-gray-300 text-sm font-medium mb-4">Why was the takeover possible?</p>
              
              <div className="space-y-3 text-sm">
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'provider_hacked' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="provider_hacked" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'provider_hacked'} className="mr-3" />
                  <span className="text-gray-300">Hosting Provider was hacked</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'provider_vulnerable' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="provider_vulnerable" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'provider_vulnerable'} className="mr-3" />
                  <span className="text-gray-300">Hosting Provider was vulnerable</span>
                </label>
                <label className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'developer_dns' ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="developer_dns" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'developer_dns'} className="mr-3 mt-1" />
                  <div>
                    <span className="text-white font-medium block">Developer left the DNS record pointing to a hosting resource they no longer owned.</span>
                    <span className="text-gray-400 text-xs mt-0.5 block">(In this lab: {infrastructure.provider || 'GitHub Pages'})</span>
                  </div>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'browser_bug' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="browser_bug" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'browser_bug'} className="mr-3" />
                  <span className="text-gray-300">Browser cache bug</span>
                </label>
              </div>
            </div>

            <button 
              onClick={runVerification} 
              disabled={isVerifying || !selectedAnswer || (scene !== 'VERIFY' && scene !== 'COMPLETE')}
              className="w-full bg-white hover:bg-gray-200 text-black font-black py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto relative z-10"
            >
              {isVerifying ? "Verifying..." : "Explain the Bug"}
            </button>
          </div>

        </div>
      </div>

      {/* 🏆 FINAL FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-black p-6 text-center border-b border-gray-800">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">Subdomain Takeover</h2>
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
                  Developer deleted the <strong className="text-blue-600">HOUSE</strong> but forgot the <strong className="text-yellow-600">ADDRESS</strong>.<br/><br/>
                  That's a <strong className="text-red-600">Subdomain Takeover</strong>.<br/><br/>
                  <strong className="text-gray-900">DNS should always point to infrastructure you still control.</strong>
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