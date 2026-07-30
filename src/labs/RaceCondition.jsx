import { useState, useEffect } from 'react';

// Custom syntax highlighter for the Turbo Intruder Python script
const PythonHighlight = () => {
  const code = `def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=5,
                           pipeline=False)
                           
    # Queue 2 requests SIMULTANEOUSLY
    engine.queue(target.req, "User A")
    engine.queue(target.req, "User B")

def handleResponse(req, interesting):
    table.add(req)`;

  let highlighted = code.replace(/(def|engine|target|wordlists|table|RequestEngine|queue|add)/g, '<span class="text-blue-400 font-bold">$1</span>');
  highlighted = highlighted.replace(/("User A"|"User B"|endpoint|concurrentConnections|pipeline|False|True)/g, '<span class="text-orange-400">$1</span>');
  highlighted = highlighted.replace(/(#.*?)\n/g, '<span class="text-gray-500 italic">$1</span>\n');

  return <pre dangerouslySetInnerHTML={{ __html: highlighted }} className="font-mono text-sm leading-relaxed whitespace-pre-wrap" />;
};

export default function RaceCondition() {
  // UI States
  const [activeTab, setActiveTab] = useState("proxy"); // 'proxy' or 'turbo'
  const [interceptOn, setInterceptOn] = useState(false);
  
  // Data States
  const [bookings, setBookings] = useState([]);
  const [seatAvailable, setSeatAvailable] = useState(true);
  
  // Lab Flow States
  const [interceptedReq, setInterceptedReq] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackLog, setAttackLog] = useState([]);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/book-seat");
      const data = await res.json();
      setBookings(data.bookings);
      setSeatAvailable(data.seatAvailable);
    } catch (err) {
      console.error(err);
    }
  };

  const resetLab = async () => {
    await fetch("/api/book-seat", { method: "DELETE" });
    setInterceptedReq(false);
    setAttackLog([]);
    setActiveTab("proxy");
    fetchState();
  };

  const handleBookNow = async () => {
    if (interceptOn) {
      // Catch the request in our simulated proxy
      setInterceptedReq(true);
      setActiveTab("proxy");
      return;
    }

    // Normal booking flow (will succeed once, then fail)
    try {
      const res = await fetch("/api/book-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "Normal User" })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Booking Failed: Seat is already booked.");
      }
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const runTurboAttack = async () => {
    setIsAttacking(true);
    setAttackLog([{ time: new Date().toLocaleTimeString(), msg: "Turbo Intruder Initialized." }]);
    
    setTimeout(() => {
      setAttackLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: "Firing 2 requests simultaneously..." }]);
    }, 500);

    // The Exploit: Promise.all dispatches both network requests at the EXACT same time.
    setTimeout(async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch("/api/book-seat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "User A" }) }),
          fetch("/api/book-seat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "User B" }) })
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        setAttackLog(prev => [
          ...prev, 
          { time: new Date().toLocaleTimeString(), msg: `[Req 1] Response: ${data1.message} (200 OK)` },
          { time: new Date().toLocaleTimeString(), msg: `[Req 2] Response: ${data2.message} (200 OK)` },
          { time: new Date().toLocaleTimeString(), msg: "Attack complete." }
        ]);
        
        fetchState();
      } catch (err) {
        console.error("Attack failed", err);
      } finally {
        setIsAttacking(false);
      }
    }, 1200);
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/check-race-progress");
      const data = await res.json();
      if (data.complete) {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        alert("Exploit not detected. Did you successfully double-book the seat using Turbo Intruder?");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-gray-900 pb-10">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">🎬 MovieHub</h1>
          <button onClick={resetLab} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold px-4 py-2 rounded-lg transition">
            Reset Lab
          </button>
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 md:p-6 gap-6 flex-1">
        
        {/* LEFT PANE: The Target UI */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Fake Movie Poster Gradient */}
            <div className="h-48 bg-gradient-to-tr from-purple-900 via-indigo-800 to-blue-900 relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <span className="text-6xl">🍿</span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <span className="bg-white/20 backdrop-blur text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">Premiere</span>
                <h2 className="text-2xl font-black shadow-sm">The Matrix: Resurrections</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Selected Seat</p>
                  <p className="text-3xl font-black text-gray-900">A12</p>
                </div>
                {seatAvailable ? (
                  <div className="bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1.5 rounded-full border border-orange-200 flex items-center gap-1 animate-pulse">
                    <span>🔥</span> Only 1 Seat Left
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-500 text-sm font-bold px-3 py-1.5 rounded-full border border-gray-200 flex items-center gap-1">
                    <span>🚫</span> Sold Out
                  </div>
                )}
              </div>

              <button 
                onClick={handleBookNow} 
                disabled={!seatAvailable && !interceptOn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-black py-4 rounded-xl text-lg transition shadow-lg"
              >
                {seatAvailable ? "Confirm Booking — ₹450" : "Unavailable"}
              </button>
            </div>
          </div>

          {/* Booking History (The Visual Payoff) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Booking Ledger: Seat A12</h3>
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((u, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${bookings.length > 1 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-green-50 border-green-200'}`}>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{u}</p>
                      <p className="text-xs text-gray-500">Seat A12</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded uppercase tracking-wider ${bookings.length > 1 ? 'text-red-700 bg-red-200' : 'text-green-700 bg-green-200'}`}>
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
            {bookings.length > 1 && (
              <div className="mt-4 text-xs font-bold text-red-600 bg-red-100 p-2 rounded text-center border border-red-200">
                CRITICAL LOGIC ERROR: Double Booking Detected
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Hacker Tools */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-800 overflow-hidden flex flex-col min-h-[500px]">
            {/* Tool Tabs */}
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex justify-between items-center">
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTab('proxy')}
                  className={`text-xs font-bold px-4 py-2 rounded-t-lg transition ${activeTab === 'proxy' ? 'bg-[#1e1e1e] text-orange-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Burp Proxy
                </button>
                <button 
                  onClick={() => setActiveTab('turbo')}
                  disabled={!interceptedReq}
                  className={`text-xs font-bold px-4 py-2 rounded-t-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'turbo' ? 'bg-[#1e1e1e] text-orange-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Turbo Intruder
                </button>
              </div>
              
              {activeTab === 'proxy' && (
                <button 
                  onClick={() => setInterceptOn(!interceptOn)}
                  className={`text-xs font-bold px-4 py-1.5 rounded transition border ${interceptOn ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-gray-700 text-gray-300 border-gray-600'}`}
                >
                  Intercept is {interceptOn ? "ON" : "OFF"}
                </button>
              )}
            </div>

            {/* PROXY TAB */}
            {activeTab === 'proxy' && (
              <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                <div className="p-4 flex-1 flex flex-col justify-center items-center">
                  {!interceptedReq ? (
                    <div className="text-gray-500 font-mono text-sm text-center space-y-2">
                      <p>Waiting for request...</p>
                      <p className="text-xs text-gray-600">Turn Intercept ON and click 'Confirm Booking' to capture.</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col animate-fade-in text-left">
                      <div className="bg-[#252526] text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 border-b border-gray-700">
                        Intercepted Request
                      </div>
                      <pre className="p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap flex-1 bg-[#1e1e1e] border-b border-gray-700">
<span className="text-blue-400 font-bold">POST</span> /api/book-seat <span className="text-green-400">HTTP/1.1</span><br/>
Host: <span className="text-yellow-400">moviehub.local</span><br/>
Content-Type: application/json<br/><br/>
&#123;<br/>
  "seat": "A12",<br/>
  "user": "Hacker"<br/>
&#125;
                      </pre>
                      <div className="p-4 flex justify-end">
                        <button 
                          onClick={() => setActiveTab('turbo')}
                          className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded transition"
                        >
                          Send to Turbo Intruder ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TURBO INTRUDER TAB */}
            {activeTab === 'turbo' && (
              <div className="flex-1 flex flex-col bg-[#1e1e1e] animate-fade-in">
                <div className="bg-[#252526] text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 border-b border-gray-700 flex justify-between items-center">
                  <span>Python Script (Prepared)</span>
                  <button 
                    onClick={runTurboAttack}
                    disabled={isAttacking}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded shadow-sm transition disabled:opacity-50"
                  >
                    {isAttacking ? "Attacking..." : "Attack"}
                  </button>
                </div>
                
                {/* Script Editor Pane */}
                <div className="p-4 border-b border-gray-700">
                  <PythonHighlight />
                </div>

                {/* Execution Log */}
                <div className="flex-1 p-4 font-mono text-xs text-gray-300 overflow-y-auto bg-black">
                  {attackLog.length === 0 && <span className="text-gray-600">Waiting to execute...</span>}
                  {attackLog.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-gray-500">[{log.time}]</span> {log.msg.includes('200 OK') ? <span className="text-green-400">{log.msg}</span> : log.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🧠 HACKER CONSOLE */}
          <div className="bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 text-center mt-auto">
            <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-widest">Hacker Console</h3>
            <p className="text-gray-400 text-xs mb-4">
              Can you bypass the 1-seat limit by sending simultaneous requests?
            </p>
            <button 
              onClick={runVerification} 
              disabled={isVerifying}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded transition shadow-[0_0_15px_rgba(22,163,74,0.3)] disabled:opacity-50 text-sm"
            >
              {isVerifying ? "Verifying..." : "Run Verification"}
            </button>
          </div>

        </div>
      </div>

      {/* 🏆 FINAL FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-green-600 p-6 text-center">
              <h2 className="text-2xl font-black text-white tracking-wide">DOUBLE BOOKING SUCCESS</h2>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 font-mono text-green-600 font-black text-lg select-all">
                  {flag}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6">
                <p className="text-blue-800 font-bold mb-2 flex items-center text-sm uppercase tracking-wider">
                  <span className="mr-2 text-lg">🧠</span> Hacker Memory
                </p>
                <p className="text-blue-900 text-sm leading-relaxed font-medium">
                  Race Condition ka secret payload nahi hota. Secret hota hai <strong>timing</strong>.<br/><br/>
                  Server ne dono requests ko ek saath valid maan liya. Decision pehle hua. Seat baad mein remove hui.
                </p>
              </div>

              <a href="https://forms.gle/placeholder" target="_blank" rel="noreferrer" className="block w-full bg-black text-white text-center font-bold py-3 rounded-lg hover:bg-gray-800 transition">
                Submit Flag
              </a>
              <button onClick={() => setShowFlagModal(false)} className="block w-full text-center text-gray-400 font-bold py-3 mt-2 hover:text-gray-600 transition">
                Return to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}