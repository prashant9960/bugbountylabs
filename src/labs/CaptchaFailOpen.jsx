import { useState, useEffect } from 'react';

export default function CaptchaFailOpen() {
  // Global Lab State
  const [labState, setLabState] = useState(null);
  
  // Clean State Machine
  const [scene, setScene] = useState('REGISTER'); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Used for inline request spinner
  
  // Registration & Intercept States
  const [captchaStatus, setCaptchaStatus] = useState('UNSOLVED'); 
  const [paramRemoved, setParamRemoved] = useState(false);
  
  // Cinematic Animations
  const [serverAnim, setServerAnim] = useState(0);
  const [successAnim, setSuccessAnim] = useState(0);
  const [explainStep, setExplainStep] = useState(0);
  
  // Quiz & Verification
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchState();
  }, []);

  // Handle Server Flow Animation
  useEffect(() => {
    if (scene === 'FORWARD') {
      const t1 = setTimeout(() => setServerAnim(1), 500);  // CAPTCHA Token? NONE
      const t2 = setTimeout(() => setServerAnim(2), 1500); // Validation Skipped ❌
      const t3 = setTimeout(() => setServerAnim(3), 2500); // Create User()
      const t4 = setTimeout(() => setServerAnim(4), 3500); // 200 OK
      const t5 = setTimeout(() => { setScene('SUCCESS'); }, 4500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
    }
  }, [scene]);

  // Handle Emotional Payoff Freeze & Trigger Backend Timeline Update
  useEffect(() => {
    if (scene === 'SUCCESS') {
      const t1 = setTimeout(() => setSuccessAnim(1), 1500); // Wait...
      const t2 = setTimeout(() => setSuccessAnim(2), 2500); // CAPTCHA was never validated
      const t3 = setTimeout(async () => {
        setScene('EXPLAIN');
        // Backend handles timeline progression as the single source of truth
        await fetch("/api/captcha-fail-open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'BEGIN_EXPLANATION' })
        });
        await fetchState();
      }, 4500); 
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [scene]);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/captcha-fail-open");
      const data = await res.json();
      setLabState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetLab = async () => {
    setIsResetting(true);
    await fetch("/api/captcha-fail-open", { method: "DELETE" });
    
    // Reset local state instantly under the overlay
    setScene('REGISTER');
    setCaptchaStatus('UNSOLVED');
    setParamRemoved(false);
    setServerAnim(0);
    setSuccessAnim(0);
    setExplainStep(0);
    setSelectedAnswer("");
    await fetchState();

    setTimeout(() => setIsResetting(false), 400);
  };

  // --- SCENE ACTIONS ---

  const handleCaptchaClick = async () => {
    if (captchaStatus === 'SOLVED') return;
    setCaptchaStatus('SOLVING');
    setTimeout(async () => {
      setCaptchaStatus('SOLVED');
      await fetch("/api/captcha-fail-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'SOLVE_CAPTCHA' })
      });
      await fetchState();
    }, 600);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (captchaStatus !== 'SOLVED') return;
    
    setIsTransitioning(true);
    await fetch("/api/captcha-fail-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'CAPTURE_REQUEST' })
    });
    await fetchState();

    setTimeout(() => {
      setScene('INTERCEPT');
      setIsTransitioning(false);
    }, 400);
  };

  const handleRemoveParam = async () => {
    setParamRemoved(true);
    await fetch("/api/captcha-fail-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'REMOVE_CAPTCHA_TOKEN' })
    });
    await fetchState();
  };

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    
    const payload = {
      name: "Hunter",
      email: "hunter@example.com",
      password: "hunter_password_123",
      ...(paramRemoved ? {} : { captchaToken: "03AGdBq27xZ_M1..." })
    };

    await fetch("/api/captcha-fail-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'SUBMIT_REQUEST', payload })
    });
    await fetchState();

    // Show the inline loader briefly before transitioning to the server animation
    setTimeout(() => {
      setScene('FORWARD');
      setIsSubmitting(false);
    }, 800);
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/captcha-fail-open?action=verify");
      const data = await res.json();
      if (data.complete && selectedAnswer === "never_validated") {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900 pb-10 overflow-hidden relative">
      
      {/* RESET OVERLAY */}
      {isResetting && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <h2 className="text-gray-900 text-lg font-bold tracking-widest uppercase">Fresh Registration...</h2>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hunter Labs</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Day 12: CAPTCHA Fail-Open</p>
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
          
          {/* SCENE: REGISTER */}
          {scene === 'REGISTER' && (
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md mx-auto w-full transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-black rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black">V</div>
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
              </div>
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                  <input type="text" disabled value="Hunter" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input type="email" disabled value="hunter@example.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input type="password" disabled value="hunter_password_123" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed tracking-widest" />
                </div>
                
                {/* SAFE EDUCATIONAL CAPTCHA WIDGET */}
                <div 
                  onClick={handleCaptchaClick}
                  className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all duration-300 ${captchaStatus === 'SOLVED' ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-50 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${captchaStatus === 'SOLVED' ? 'bg-green-500 border-green-500' : 'border-gray-400 bg-white'}`}>
                      {captchaStatus === 'SOLVING' && <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>}
                      {captchaStatus === 'SOLVED' && <svg className="w-4 h-4 text-white animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                    </div>
                    <span className={`font-bold text-sm ${captchaStatus === 'SOLVED' ? 'text-green-800' : 'text-gray-700'}`}>Human Verification</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {captchaStatus === 'SOLVED' ? 'Verified' : 'Protected'}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={captchaStatus !== 'SOLVED'}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition shadow-md"
                >
                  Register
                </button>
              </form>
            </div>
          )}

          {/* SCENE: REQUEST VIEWER & SUCCESS PAYOFF */}
          {(scene === 'INTERCEPT' || scene === 'SUCCESS') && (
            <div className={`bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-800 overflow-hidden flex flex-col transition-opacity duration-300 animate-fade-in-up`}>
              <div className="bg-[#2d2d2d] px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Request Viewer
                </span>
              </div>
              
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#1e1e1e] text-gray-300">
                <div className="mb-2 text-gray-500 font-bold text-xs uppercase tracking-widest">Request</div>
                <span className="text-pink-400">POST</span> <span className="text-gray-100">/api/register</span> HTTP/1.1<br/>
                Host: api.vertex.local<br/>
                Content-Type: application/json<br/>
                <br/>
                &#123;<br/>
                &nbsp;&nbsp;<span className="text-blue-300">"name"</span>: <span className="text-green-300">"Hunter"</span>,<br/>
                &nbsp;&nbsp;<span className="text-blue-300">"email"</span>: <span className="text-green-300">"hunter@example.com"</span>,<br/>
                &nbsp;&nbsp;<span className="text-blue-300">"password"</span>: <span className="text-green-300">"hunter_password_123"</span><span className={paramRemoved ? '' : ','}>{paramRemoved ? '' : ','}</span><br/>
                
                {/* PREMIUM INLINE DELETION ANIMATION */}
                <div className={`transition-all duration-500 ease-in-out ${paramRemoved ? 'opacity-0 max-h-0 m-0 overflow-hidden' : 'opacity-100 max-h-12 mb-1'}`}>
                  <div className="group flex items-center bg-yellow-400/10 text-yellow-200 px-2 py-0.5 rounded border border-transparent hover:border-yellow-500/50 hover:bg-yellow-400/20 cursor-pointer transition w-fit" onClick={handleRemoveParam}>
                    <span>&nbsp;&nbsp;<span className="text-yellow-300 font-bold">"captchaToken"</span>: <span className="text-yellow-100">"03AGdBq27xZ_M1..."</span></span>
                    <span className="ml-4 opacity-0 group-hover:opacity-100 text-red-400 font-sans text-xs uppercase tracking-wider font-bold">✕ Delete</span>
                  </div>
                </div>
                &#125;
                
                {/* INLINE PROCESSING SPINNER */}
                {isSubmitting && (
                  <div className="mt-6 pt-6 border-t border-gray-700 animate-fade-in flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 font-mono text-sm">Awaiting Response...</span>
                  </div>
                )}

                {/* INLINE RESPONSE PAYOFF */}
                {scene === 'SUCCESS' && (
                  <div className="mt-6 pt-6 border-t border-gray-700 animate-fade-in">
                    <div className="mb-2 text-gray-500 font-bold text-xs uppercase tracking-widest">Response</div>
                    <span className="text-green-400 font-bold">HTTP/1.1 200 OK</span><br/>
                    Content-Type: application/json<br/>
                    <br/>
                    &#123;<br/>
                    &nbsp;&nbsp;"success": <span className="text-orange-400">true</span>,<br/>
                    &nbsp;&nbsp;"status": <span className="text-green-300">"Account Created"</span>,<br/>
                    &nbsp;&nbsp;"accountId": <span className="text-blue-300">"USR-28491"</span><br/>
                    &#125;
                  </div>
                )}
              </div>

              {scene === 'INTERCEPT' && (
                <div className="bg-[#111] p-5 border-t border-gray-800 flex justify-end">
                  <button 
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting}
                    className="bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black px-6 py-2 rounded-lg transition shadow-lg text-sm flex items-center gap-2"
                  >
                    Forward Request ➔
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCENE: SERVER FLOW ANIMATION */}
          {scene === 'FORWARD' && (
            <div className="bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-800 p-10 flex flex-col items-center justify-center animate-fade-in min-h-[400px]">
              <div className="flex items-center gap-4 text-gray-400 font-mono text-sm w-full justify-between px-10 mb-12">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">💻</span>
                  <span>Client</span>
                </div>
                <div className="flex-1 h-px bg-gray-700 relative">
                  <div className="absolute inset-y-0 left-0 bg-blue-500 animate-[flowRight_1.5s_ease-in-out_forwards]"></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">☁️</span>
                  <span>API Server</span>
                </div>
              </div>

              <div className="space-y-4 w-full max-w-sm text-center">
                {serverAnim >= 1 && (
                  <div className="bg-gray-900 border border-gray-700 px-4 py-3 rounded text-gray-300 font-mono animate-fade-in-up flex justify-between items-center">
                    <span>CAPTCHA Token?</span>
                    <span className="text-gray-500 font-bold">NONE</span>
                  </div>
                )}
                {serverAnim >= 2 && (
                  <div className="bg-red-900/30 border border-red-700/50 px-4 py-3 rounded text-red-400 font-mono font-bold animate-fade-in-up">
                    Validation Skipped ❌
                  </div>
                )}
                {serverAnim >= 3 && (
                  <div className="bg-gray-900 border border-gray-700 px-4 py-3 rounded text-white font-mono animate-fade-in-up border-l-4 border-l-blue-500">
                    Create User()
                  </div>
                )}
                {serverAnim >= 4 && (
                  <div className="bg-green-900/30 border border-green-500/30 px-4 py-3 rounded text-green-400 font-mono font-bold animate-fade-in-up">
                    200 OK
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMOTIONAL PAYOFF OVERLAY (Shown over the Success Response) */}
          {scene === 'SUCCESS' && successAnim >= 1 && (
            <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
              <h1 className="text-5xl font-black text-white mb-4">Wait...</h1>
              {successAnim >= 2 && (
                <p className="text-2xl text-red-400 font-medium animate-fade-in-up">CAPTCHA was never validated.</p>
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

              <div className="flex-1 flex flex-col justify-center">
                
                {/* SLIDE 0: Developer Assumption vs Reality */}
                {explainStep === 0 && (
                  <div className="animate-fade-in grid grid-cols-2 gap-8 items-center w-full max-w-xl mx-auto">
                    <div className="text-center space-y-4">
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Developer Expected</p>
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6">
                        <p className="text-blue-300 font-medium">Token always exists</p>
                      </div>
                    </div>
                    <div className="text-center space-y-4">
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Reality</p>
                      <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6">
                        <p className="text-red-300 font-medium">Requests can be modified</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 1: Normal Flow */}
                {explainStep === 1 && (
                  <div className="animate-fade-in space-y-6 text-center">
                    <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">How it was supposed to work</h3>
                    <div className="flex items-center justify-center gap-4 text-gray-300 font-mono text-sm">
                      <span className="bg-gray-800 p-3 rounded">Browser</span>
                      <span className="text-gray-500">➔</span>
                      <span className="bg-blue-900/40 text-blue-400 border border-blue-500/30 p-3 rounded">Token</span>
                      <span className="text-gray-500">➔</span>
                      <span className="bg-gray-800 p-3 rounded">Validate</span>
                      <span className="text-gray-500">➔</span>
                      <span className="bg-green-900/30 text-green-400 p-3 rounded border border-green-500/30">Create User</span>
                    </div>
                  </div>
                )}

                {/* SLIDE 2: The Attack Flow */}
                {explainStep === 2 && (
                  <div className="animate-fade-in space-y-6 text-center">
                    <h3 className="text-red-400 font-bold mb-6 uppercase tracking-wider text-sm">What actually happened</h3>
                    <div className="flex items-center justify-center gap-4 text-gray-300 font-mono text-sm">
                      <span className="bg-gray-800 p-3 rounded">Browser</span>
                      <span className="text-gray-500">➔</span>
                      <span className="bg-red-900/40 text-red-400 border border-red-500/30 p-3 rounded">NOTHING</span>
                      <span className="text-gray-500">➔</span>
                      <span className="bg-gray-800 p-3 rounded">Server</span>
                      <span className="text-gray-500">➔</span>
                      <span className="bg-red-900/30 text-red-400 font-bold p-3 rounded border border-red-500/30">Create User</span>
                    </div>
                  </div>
                )}

                {/* SLIDE 3: Core Issue */}
                {explainStep === 3 && (
                  <div className="animate-fade-in text-center space-y-4">
                    <p className="text-2xl text-gray-300 leading-relaxed font-light">
                      Server received a request<br/>
                      <strong className="text-white">without a CAPTCHA token.</strong>
                    </p>
                    <p className="text-2xl text-gray-300 leading-relaxed font-light">
                      Instead of rejecting it...<br/>
                      <strong className="text-red-400">it accepted it.</strong>
                    </p>
                  </div>
                )}

                {/* SLIDE 4: Code Comparison */}
                {explainStep === 4 && (
                  <div className="animate-fade-in grid grid-cols-2 gap-6">
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl overflow-hidden">
                      <div className="bg-red-900/30 px-4 py-2 text-red-400 font-bold text-xs uppercase tracking-widest text-center border-b border-red-900/30">Bad Code (Fail Open)</div>
                      <pre className="p-6 text-gray-300 font-mono text-sm leading-relaxed">
if (<span className="text-yellow-300">captchaToken</span>) &#123;<br/>
&nbsp;&nbsp;validate();<br/>
&#125;<br/><br/>
<span className="text-gray-500">// This line ALWAYS runs</span><br/>
<span className="text-green-400 font-bold">createUser();</span>
                      </pre>
                    </div>
                    <div className="bg-green-950/20 border border-green-900/30 rounded-xl overflow-hidden">
                      <div className="bg-green-900/30 px-4 py-2 text-green-400 font-bold text-xs uppercase tracking-widest text-center border-b border-green-900/30">Good Code (Fail Closed)</div>
                      <pre className="p-6 text-gray-300 font-mono text-sm leading-relaxed">
if (!<span className="text-yellow-300">captchaToken</span>) &#123;<br/>
&nbsp;&nbsp;<span className="text-red-400 font-bold">reject();</span><br/>
&#125;<br/><br/>
validate();<br/>
<span className="text-green-400 font-bold">createUser();</span>
                      </pre>
                    </div>
                  </div>
                )}

                {/* SLIDE 5: The Mental Model */}
                {explainStep === 5 && (
                  <div className="animate-fade-in flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
                    <div className="w-full bg-red-950/40 border border-red-900/50 rounded-xl p-5 text-center">
                      <h3 className="text-red-400 font-black text-2xl tracking-widest mb-3">FAIL OPEN</h3>
                      <div className="text-red-300/80 text-sm font-bold uppercase space-y-2">
                        <p>➔ Missing Check</p>
                        <p>➔ Request Continues</p>
                      </div>
                    </div>
                    <div className="w-full bg-green-950/40 border border-green-900/50 rounded-xl p-5 text-center">
                      <h3 className="text-green-400 font-black text-2xl tracking-widest mb-3">FAIL CLOSED</h3>
                      <div className="text-green-300/80 text-sm font-bold uppercase space-y-2">
                        <p>➔ Reject Immediately</p>
                      </div>
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

        {/* RIGHT PANE: Timeline & Hacker Console */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-40">
          
          {/* VALIDATION TIMELINE (Driven completely by backend state, with accessible icons) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Validation Timeline</span>
            </div>
            <div className="p-6 bg-white">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent">
                
                {/* Step 1: Captcha Solved */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 2 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 2 ? 'border-green-500 text-green-500' : 'border-gray-300'}`}>
                    {currentStep >= 2 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">CAPTCHA Solved</p>
                  </div>
                </div>

                {/* Step 2: Request Created */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 3 ? 'border-green-500 text-green-500' : 'border-gray-300'}`}>
                     {currentStep >= 3 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Request Created</p>
                  </div>
                </div>

                {/* Step 3: Parameter Missing */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 4 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 4 ? 'border-yellow-500 bg-yellow-100 text-yellow-600 font-bold text-xs' : 'border-gray-300'}`}>
                     {currentStep >= 4 && <span aria-hidden="true">⚠</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-yellow-50 p-2.5 rounded-lg border border-yellow-200 text-sm shadow-sm">
                    <p className="font-bold text-yellow-900">⚠ Parameter Missing</p>
                  </div>
                </div>

                {/* Step 4: Request Received */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 5 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 5 ? 'border-green-500 text-green-500' : 'border-gray-300'}`}>
                    {currentStep >= 5 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Request Received</p>
                  </div>
                </div>

                {/* Step 5: Registration Accepted */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 6 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 6 ? 'border-green-500 text-green-500 bg-green-50' : 'border-gray-300'}`}>
                    {currentStep >= 6 && <span aria-hidden="true">✔</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Registration Accepted</p>
                  </div>
                </div>

                {/* Step 6: The Lesson Learned (Visually Distinct) */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300 ${currentStep >= 7 ? 'opacity-100 delay-300' : 'opacity-30 grayscale'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 7 ? 'border-purple-500 bg-purple-100' : 'border-gray-300'}`}>
                    {currentStep >= 7 && <span className="text-purple-600 text-[10px] font-black" aria-hidden="true">✖</span>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-sm shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mb-0.5">Lesson Learned</p>
                    <p className="font-black text-purple-700 tracking-wide flex items-center gap-1">
                      <span aria-hidden="true">✖</span> Missing Validation
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* HACKER CONSOLE */}
          <div className="bg-[#111] rounded-xl p-6 shadow-xl border border-gray-800 flex flex-col mt-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-10h2v8h-2V7z"></path></svg>
            </div>
            
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hacker Console
            </h3>
            
            <div className="mb-6 relative z-10">
              <p className="text-gray-300 text-sm font-medium mb-4">Why didn't CAPTCHA stop registration?</p>
              
              <div className="space-y-3 text-sm">
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'captcha_solved' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="captcha_solved" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'captcha_solved'} className="mr-3" />
                  <span className="text-gray-300">CAPTCHA was solved</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'captcha_optional' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="captcha_optional" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'captcha_optional'} className="mr-3" />
                  <span className="text-gray-300">CAPTCHA was optional</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'never_validated' ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="never_validated" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'never_validated'} className="mr-3" />
                  <span className="text-white font-medium">Server never validated the missing CAPTCHA</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'browser_bug' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="browser_bug" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'browser_bug'} className="mr-3" />
                  <span className="text-gray-300">Browser bug</span>
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
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">CAPTCHA FAIL-OPEN COMPLETE</h2>
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
                  Server received a request without a CAPTCHA token.<br/>
                  Instead of rejecting it... <strong className="text-red-500">it accepted it.</strong><br/><br/>
                  Security checks ko hamesha <strong className="text-green-600">Fail Closed</strong> design karna chahiye.<br/><br/>
                  <strong className="text-gray-900">Never assume the client enforced security—the server must enforce it.</strong>
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