import { useState, useEffect } from 'react';

export default function PreATO() {
  // Global Lab State
  const [labState, setLabState] = useState(null);
  
  // UI Scene Management: 'REGISTER', 'ATTACKER_DASH', 'TIME_SKIP', 'GOOGLE_LOGIN', 'VICTIM_DASH', 'ATTACKER_LOGIN', 'SHARED_DASH'
  const [scene, setScene] = useState('REGISTER'); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Quiz & Verification
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/pre-ato");
      const data = await res.json();
      setLabState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetLab = async () => {
    await fetch("/api/pre-ato", { method: "DELETE" });
    setScene('REGISTER');
    setShowExplanation(false);
    setSelectedAnswer("");
    fetchState();
  };

  // --- SCENE ACTIONS ---

  const handleRegister = async (e) => {
    e.preventDefault();
    await fetch("/api/pre-ato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'REGISTER', email: 'victim@gmail.com', password: 'hunter123' })
    });
    await fetchState();
    setScene('ATTACKER_DASH');
  };

  const handleTimeSkip = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setScene('GOOGLE_LOGIN');
      setIsTransitioning(false);
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsTransitioning(true);
    await fetch("/api/pre-ato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'GOOGLE_LOGIN' })
    });
    await fetchState();
    setTimeout(() => {
      setScene('VICTIM_DASH');
      setIsTransitioning(false);
    }, 1000);
  };

  const handleVictimLogout = () => {
    setScene('ATTACKER_LOGIN');
  };

  const handleAttackerLogin = async (e) => {
    e.preventDefault();
    await fetch("/api/pre-ato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'PASSWORD_LOGIN', password: 'hunter123' })
    });
    await fetchState();
    setScene('SHARED_DASH');
    setTimeout(() => setShowExplanation(true), 1500); // Trigger cinematic explanation
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/pre-ato?action=verify");
      const data = await res.json();
      if (data.complete && selectedAnswer === "email_not_identity") {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        alert("Verification failed. Did you complete the scenario and select the correct root cause?");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  // --- RENDER HELPERS ---
  const currentStep = labState?.timelineStep || 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900 pb-10">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hunter Labs</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Day 11: Pre-Account Takeover</p>
          </div>
          <button onClick={resetLab} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded-lg transition">
            Reset Lab
          </button>
        </div>
      </div>

      {/* FULL SCREEN TIME SKIP OVERLAY */}
      {isTransitioning && scene === 'ATTACKER_DASH' && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fade-in">
          <h2 className="text-white text-4xl font-black tracking-widest animate-pulse">⏩ 3 DAYS LATER</h2>
        </div>
      )}

      {/* MAIN SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 md:p-6 gap-8 flex-1 mt-4">
        
        {/* LEFT PANE: The SaaS Application */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative">
          
          {/* SCENE 1: ATTACKER REGISTRATION */}
          {scene === 'REGISTER' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md mx-auto w-full animate-fade-in-up mt-10">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black">S</div>
                <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
                <p className="text-gray-500 text-sm mt-2">Start your 14-day free trial.</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" disabled value="victim@gmail.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input type="text" disabled value="hunter123" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed font-mono" />
                </div>
                <button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition shadow-md">
                  Register Account
                </button>
              </form>
            </div>
          )}

          {/* SCENE 2: ATTACKER DASHBOARD (UNVERIFIED) */}
          {scene === 'ATTACKER_DASH' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up">
              <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">UNVERIFIED</span>
              </div>
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl">✉️</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Please verify your email</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">We've sent a verification link to <strong>victim@gmail.com</strong>. The account is limited until verified.</p>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <button onClick={handleTimeSkip} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow transition flex items-center justify-center gap-2 mx-auto">
                    ⏩ Fast Forward 3 Days
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 3: GOOGLE LOGIN (VICTIM) */}
          {scene === 'GOOGLE_LOGIN' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md mx-auto w-full animate-fade-in-up mt-10">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black">S</div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-2">Log in to your account.</p>
              </div>
              
              <button onClick={handleGoogleLogin} className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-3 rounded-lg transition flex items-center justify-center gap-3 mb-6 relative overflow-hidden group">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
                {isTransitioning && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
              </button>

              <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-gray-200 w-full absolute"></div>
                <span className="bg-white px-4 text-xs font-bold text-gray-400 relative">OR</span>
              </div>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <input type="email" placeholder="Email" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50" />
                <input type="password" placeholder="Password" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50" />
                <button className="w-full bg-black text-white font-bold py-3 rounded-lg">Login</button>
              </div>
            </div>
          )}

          {/* SCENE 4: VICTIM DASHBOARD (MERGED) */}
          {scene === 'VICTIM_DASH' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up">
              <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full text-white flex items-center justify-center font-bold">R</div>
                  <h2 className="text-xl font-bold text-gray-900">Welcome, Rahul</h2>
                </div>
                <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-full tracking-wide flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  VERIFIED
                </span>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="border border-gray-100 bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Wallet Balance</p>
                    <p className="text-2xl font-black text-gray-900">$450.00</p>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Active Subscriptions</p>
                    <p className="text-2xl font-black text-gray-900">Pro Tier</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 text-center mt-8">
                  <p className="text-sm text-gray-500 mb-4">You (the victim) use the app normally and log out.</p>
                  <button onClick={handleVictimLogout} className="text-red-600 hover:text-red-700 font-bold px-6 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 5: ATTACKER LOGIN */}
          {scene === 'ATTACKER_LOGIN' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md mx-auto w-full animate-fade-in-up mt-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Attacker Login</h2>
                <p className="text-gray-500 text-sm mt-2">Log back in using the original password.</p>
              </div>
              <form onSubmit={handleAttackerLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" disabled value="victim@gmail.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input type="text" disabled value="hunter123" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed font-mono" />
                </div>
                <button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition shadow-md">
                  Login
                </button>
              </form>
            </div>
          )}

          {/* SCENE 6: SHARED DASHBOARD (THE REVEAL) */}
          {scene === 'SHARED_DASH' && (
            <div className="bg-white rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.15)] border-2 border-red-500 overflow-hidden animate-fade-in-up relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500 animate-pulse"></div>
              
              <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full text-white flex items-center justify-center font-bold">R</div>
                  <h2 className="text-xl font-bold text-gray-900">Welcome, Rahul</h2>
                </div>
                <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
                  VERIFIED
                </span>
              </div>
              
              <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 animate-fade-in">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-wide">Shared Account Detected</p>
                    <p className="text-xs mt-0.5">The attacker logged in with their password and accessed the victim's verified profile.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-100 bg-gray-50 p-4 rounded-xl opacity-70">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Wallet Balance</p>
                    <p className="text-2xl font-black text-gray-900">$450.00</p>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-4 rounded-xl opacity-70">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Active Subscriptions</p>
                    <p className="text-2xl font-black text-gray-900">Pro Tier</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CINEMATIC EXPLANATION OVERLAY */}
          {showExplanation && (
            <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center shadow-2xl border border-gray-800">
              <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest mb-10 text-gray-400">
                <span className="bg-gray-800 px-3 py-1 rounded">UNVERIFIED</span>
                <span>➔</span>
                <span className="bg-gray-800 px-3 py-1 rounded">MERGED</span>
                <span>➔</span>
                <span className="bg-green-900/50 text-green-400 border border-green-500/30 px-3 py-1 rounded">VERIFIED</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
                Same Email<br/>
                <span className="text-red-500">≠</span> Same Identity
              </h1>
              
              <p className="text-gray-300 text-lg max-w-sm">
                Developer trusted the <strong className="text-white">Email Address</strong> instead of verifying the <strong className="text-white">User Identity</strong> before merging the accounts.
              </p>
              
              <button onClick={() => setShowExplanation(false)} className="mt-10 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition">
                Close Explanation
              </button>
            </div>
          )}

        </div>

        {/* RIGHT PANE: Timeline & Hacker Console */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* APPLICATION TIMELINE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Application Timeline</span>
            </div>
            <div className="p-6 bg-white">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 1 ? 'border-green-500 text-green-500' : 'border-gray-300'}`}>
                    {currentStep >= 1 && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Account Created</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 1 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'}`}></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Pending Verification</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 3 ? 'border-green-500 text-green-500' : 'border-gray-300'}`}>
                    {currentStep >= 3 && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>}
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm shadow-sm">
                    <p className="font-bold text-blue-900">Legitimate Google Login</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 3 ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm shadow-sm">
                    <p className="font-bold text-gray-900">Account Merged</p>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 5 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${currentStep >= 5 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-red-50 p-3 rounded-lg border border-red-200 text-sm shadow-sm">
                    <p className="font-bold text-red-900">⚠ Shared Account Accessed</p>
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
              <p className="text-gray-300 text-sm font-medium mb-4">Why did the attacker gain access to the victim's verified profile?</p>
              
              <div className="space-y-3 text-sm">
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'oauth_bug' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="oauth_bug" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'oauth_bug'} className="mr-3" />
                  <span className="text-gray-300">Google Login OAuth implementation bug</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'email_not_identity' ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="email_not_identity" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'email_not_identity'} className="mr-3" />
                  <span className="text-white font-medium">Same Email ≠ Same Identity</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswer === 'weak_pass' ? 'bg-gray-800 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'}`}>
                  <input type="radio" name="quiz" value="weak_pass" onChange={(e) => setSelectedAnswer(e.target.value)} checked={selectedAnswer === 'weak_pass'} className="mr-3" />
                  <span className="text-gray-300">The attacker used a weak password</span>
                </label>
              </div>
            </div>

            <button 
              onClick={runVerification} 
              disabled={isVerifying || !selectedAnswer || currentStep < 5}
              className="w-full bg-white hover:bg-gray-200 text-black font-black py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto relative z-10"
            >
              {isVerifying ? "Verifying..." : "Run Verification"}
            </button>
          </div>

        </div>
      </div>

      {/* 🏆 FINAL FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-black p-6 text-center border-b border-gray-800">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">Pre-ATO Success</h2>
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
                  Developer ne email ko identity maan liya. Email sirf inbox prove karti hai. Identity nahi.<br/><br/>
                  Agar application sirf email dekhkar accounts merge kare... to attacker pehle account bana sakta hai... aur baad mein asli owner ke account ka access paa sakta hai.<br/><br/>
                  <strong className="text-gray-900">Always verify identity before merging accounts.</strong>
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