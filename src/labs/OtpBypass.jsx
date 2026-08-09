// src/labs/OtpBypass.jsx
import { useState, useEffect, useRef } from 'react';

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeLqV-X60OHy5kemoz4tuEcVszq3IXKfqANdr8e6dmbdQuKpA/viewform";

export default function OtpBypass() {
  const [step, setStep] = useState(1);
  const email = "admin@vcorp.local";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [timeLeft, setTimeLeft] = useState(119);
  const [attempts, setAttempts] = useState(2);
  const [transitionStatus, setTransitionStatus] = useState("");

  const [adminData, setAdminData] = useState(null);
  const [showPayoff, setShowPayoff] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy Flag");

  const timersRef = useRef([]);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (attempts <= 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      
      // The Core Vulnerability: Frontend blindly trusts the response parameters
      if (res.status === 200 && data.verified === true) {
        setStep(3); 
        setTransitionStatus("Checking...");
        
        const t1 = setTimeout(() => setTransitionStatus("Verified"), 300);
        const t2 = setTimeout(() => setTransitionStatus("Loading Dashboard..."), 700);
        const t3 = setTimeout(() => {
          setStep(4);
          fetchAdminData(data.session); 
        }, 1100);

        timersRef.current.push(t1, t2, t3);
      } else {
        setAttempts(prev => prev - 1);
        setError(data.message || "Invalid OTP. Authentication failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Server connection error.");
      setLoading(false);
    }
  };

  const fetchAdminData = async (sessionToken) => {
    try {
      const res = await fetch("/api/v1/admin-data", {
        headers: {
          "Authorization": sessionToken ? `Bearer ${sessionToken}` : ""
        }
      });
      
      if (!res.ok) throw new Error("Unauthorized");
      
      const data = await res.json();
      setAdminData(data);
      
      if (data.solvedData) {
        const t4 = setTimeout(() => setShowPayoff(true), 1200);
        timersRef.current.push(t4);
      }
    } catch (err) {
      setError("Dashboard access denied.");
      setStep(2);
    }
  };

  const handleCopy = async (flagText) => {
    try {
      await navigator.clipboard.writeText(flagText);
      setCopyStatus("Copied!");
    } catch (err) {
      setCopyStatus("Press and hold to copy");
    }
    const t5 = setTimeout(() => setCopyStatus("Copy Flag"), 2500);
    timersRef.current.push(t5);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-gray-200">
      <div className="w-full max-w-md relative z-0">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 text-blue-500 tracking-tight">V-Corp Secure</h1>
          <p className="text-gray-500 text-sm">Internal Enterprise Gateway</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-bold">Administrator Account Detected</p>
              <p className="text-white font-mono text-lg">{email}</p>
            </div>
            <button 
              onClick={() => setStep(2)} 
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-lg font-black tracking-wide text-white transition shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              Request OTP
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Security Verification</h2>
              <p className="text-blue-400 font-mono text-sm mb-2">{email}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                OTP Sent • Expires in <span className={`font-mono font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>{formatTime(timeLeft)}</span>
              </p>
            </div>
            
            <div>
              <input 
                type="text" 
                required 
                maxLength="6" 
                disabled={attempts <= 0 || loading} 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="• • • • • •" 
                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg p-5 text-center text-4xl tracking-[0.5em] text-white focus:outline-none focus:border-blue-500 transition shadow-inner placeholder-gray-800"
              />
              <div className="text-right mt-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{attempts} attempts remaining</span>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-950/40 border border-red-900 p-5 rounded-xl text-center animate-fade-in shadow-lg">
                <p className="text-red-400 font-black tracking-widest uppercase text-xs mb-2">Verification Failed</p>
                <p className="text-red-300/80 text-sm mb-4">{error}</p>
                <button 
                  type="button"
                  onClick={() => { setOtp(""); setError(""); }}
                  className="bg-red-900/40 hover:bg-red-800/50 text-red-200 text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-lg transition"
                >
                  Try Again
                </button>
              </div>
            )}
            
            <button type="submit" disabled={loading || attempts <= 0} className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-lg font-black tracking-wide transition disabled:opacity-50 mt-4 shadow-lg">
              {loading ? "Verifying..." : "AUTHENTICATE"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 ${transitionStatus === 'Verified' || transitionStatus === 'Loading Dashboard...' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
              <div className={`w-8 h-8 rounded-full transition-colors duration-500 ${transitionStatus === 'Verified' || transitionStatus === 'Loading Dashboard...' ? 'bg-green-500' : 'bg-blue-500 animate-ping'}`}></div>
            </div>
            <h2 className="text-xl font-mono text-gray-300 tracking-wider">{transitionStatus}</h2>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Admin Console</h2>
              <span className="bg-green-900/30 text-green-400 text-xs px-3 py-1 rounded-full border border-green-800 font-bold uppercase tracking-wider">Connected</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-800 shadow-sm">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Users</p>
                <p className="text-3xl font-mono text-white">{adminData ? adminData.users.toLocaleString() : "..."}</p>
              </div>
              <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-800 shadow-sm">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Active Sessions</p>
                <p className="text-3xl font-mono text-blue-400">{adminData ? adminData.activeSessions : "..."}</p>
              </div>
              <div className="col-span-2 bg-[#1a1a1a] p-5 rounded-xl border border-gray-800 mt-2 shadow-sm">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Today's Revenue</p>
                <p className="text-4xl font-mono text-green-400">
                  {adminData ? adminData.revenue : "..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPayoff && adminData?.solvedData && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="min-h-full flex items-center justify-center p-4 py-12">
            
            <div className="w-full max-w-md bg-[#111111] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl animate-fade-in-up">
              <p className="text-blue-500 font-black tracking-widest uppercase mb-6 text-sm text-center">Authentication Bypassed</p>
              
              <div className="bg-black/50 rounded-xl p-5 font-mono text-sm border border-gray-800 text-center mb-8 shadow-inner">
                <p className="text-gray-400 mb-4 font-bold text-xs uppercase tracking-widest leading-relaxed">The app trusted a decision it shouldn't have.</p>
                <p className="text-blue-400 font-bold mb-6 text-sm uppercase tracking-widest">Response Manipulation</p>
                
                <div className="flex justify-center items-center gap-4 mb-3">
                  <span className="text-gray-500 line-through">403</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-green-400 font-bold text-lg">200</span>
                </div>
                <div className="flex justify-center items-center gap-4 mb-6 pb-6 border-b border-gray-800/80">
                  <span className="text-gray-500 line-through uppercase">False</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-green-400 font-bold text-lg uppercase">True</span>
                </div>
                
                <p className="text-gray-300 font-bold text-xs uppercase tracking-widest">
                  Protected dashboard unlocked.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl shadow-lg mb-6">
                  <h3 className="text-blue-400 font-black text-lg uppercase tracking-widest mb-1">Case Solved</h3>
                </div>
                
                <div className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800 font-mono text-gray-200 font-black text-lg sm:text-xl select-all shadow-inner mb-6 break-all tracking-wider">
                  {adminData.solvedData.flag}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleCopy(adminData.solvedData.flag)}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 text-white font-bold py-3.5 rounded-lg transition shadow-sm"
                  >
                    {copyStatus}
                  </button>
                  <a 
                    href={GOOGLE_FORM_URL} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center"
                  >
                    Submit Flag ➔
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}