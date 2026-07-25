import { useState, useEffect } from 'react';

export default function OtpBypass() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [timeLeft, setTimeLeft] = useState(119);
  const [attempts, setAttempts] = useState(2);
  const [transitionStatus, setTransitionStatus] = useState("");
  
  const [adminData, setAdminData] = useState(null);
  const [backendRejected, setBackendRejected] = useState(false);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

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
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      
      // 🚨 NEVER DO THIS
      // Relying entirely on a client-side JSON boolean to grant UI access.
      if (data.verified === true) {
        setStep(3); 
        setTransitionStatus("Checking...");
        
        // Snappy 1-second transition
        setTimeout(() => setTransitionStatus("Verified"), 300);
        setTimeout(() => setTransitionStatus("Loading..."), 700);
        setTimeout(() => {
          setStep(4);
          fetchAdminData(data.session); 
        }, 1100);

      } else {
        setAttempts(prev => prev - 1);
        setError(data.message || "Invalid OTP");
        setLoading(false);
      }
    } catch (err) {
      setError("Server error.");
      setLoading(false);
    }
  };

  const fetchAdminData = async (sessionToken) => {
    try {
      const res = await fetch("/api/v1/admin/dashboard", {
        headers: {
          "Authorization": sessionToken ? `Bearer ${sessionToken}` : ""
        }
      });
      const data = await res.json();

      if (res.status === 401) {
        setBackendRejected(true); 
      } else {
        setAdminData(data);
      }
    } catch (err) {
      setBackendRejected(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-[#0a0a0a] min-h-screen text-white font-sans">
      <div className="bg-[#111111] p-8 rounded-xl shadow-2xl border border-gray-800 relative overflow-hidden">
        
        <h1 className="text-3xl font-black mb-2 text-blue-500 tracking-tight">V-Corp Secure</h1>
        <p className="text-gray-500 mb-8 text-sm">Internal Enterprise Gateway</p>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); if (email) setStep(2); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">Employee Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@vcorp.local" className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition"/>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">Request Access</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-blue-900/10 border border-blue-900/50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Code Dispatched</p>
                <p className="text-sm text-gray-300">{email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Expires In</p>
                <p className={`font-mono ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400">Enter Security Code</label>
                <span className="text-xs text-gray-500">{attempts} attempts remaining</span>
              </div>
              <input type="text" required maxLength="6" disabled={attempts <= 0} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="• • • • • •" className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-blue-500 transition"/>
            </div>
            {error && <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm text-center">{error}</div>}
            <button type="submit" disabled={loading || attempts <= 0} className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-lg font-bold transition disabled:opacity-50">
              {loading ? "Verifying..." : "Authenticate"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-pulse">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${transitionStatus === 'Verified' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
              <div className={`w-8 h-8 rounded-full ${transitionStatus === 'Verified' ? 'bg-green-500' : 'bg-blue-500 animate-ping'}`}></div>
            </div>
            <h2 className="text-2xl font-mono text-gray-300">{transitionStatus}</h2>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Admin Console</h2>
              <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">Connected</span>
            </div>

            {backendRejected ? (
              <div className="animate-fade-in-up mt-8">
                 <div className="bg-red-950/40 border border-red-500/50 p-6 rounded-t-lg text-center">
                   <h3 className="text-xl font-black text-red-500 mb-6">401 UNAUTHORIZED</h3>
                   <div className="flex justify-center items-center gap-8 text-sm font-mono mb-2">
                     <div className="text-center">
                       <p className="text-gray-400 mb-2">Frontend</p>
                       <p className="text-green-400 bg-green-900/30 px-4 py-2 rounded">✅ Trusted</p>
                     </div>
                     <div className="text-gray-600 text-2xl">→</div>
                     <div className="text-center">
                       <p className="text-gray-400 mb-2">Backend</p>
                       <p className="text-red-400 bg-red-900/30 px-4 py-2 rounded">❌ Rejected</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-blue-900/20 border border-blue-800 p-6 rounded-b-lg text-center">
                   <p className="text-blue-400 font-bold mb-2">🧠 Lesson Learned</p>
                   <p className="text-gray-300 text-sm mb-6">
                     You successfully fooled the React application, but the backend server protected the actual data.
                   </p>
                   <button onClick={() => alert("Ready to build Lab 6?")} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                     NEXT LAB: Server-Side Auth Bypass →
                   </button>
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 transition-all duration-300">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-500 text-xs uppercase mb-1">Total Users</p>
                  <p className="text-2xl font-mono text-white">{adminData ? adminData.users : "..."}</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-500 text-xs uppercase mb-1">Today's Revenue</p>
                  <p className="text-2xl font-mono text-green-400">{adminData ? adminData.revenue : "..."}</p>
                </div>
                <div className="col-span-2 bg-[#1a1a1a] p-4 rounded-lg border border-gray-800 mt-2">
                  <p className="text-gray-500 text-xs uppercase mb-2">Production API Key</p>
                  <p className="text-lg font-mono text-gray-300 blur-sm select-none">
                    {adminData ? adminData.apiKey : "..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}