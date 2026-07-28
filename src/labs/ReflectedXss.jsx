import { useState, useEffect } from 'react';

// Upgraded Syntax Highlighter with dynamic glowing traps
const HighlightHTML = ({ code, isBreakout, highlightTrap }) => {
  if (!code) return null;
  
  let html = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (isBreakout) {
    const breakoutTarget = 'value=&quot;&quot;&gt;&lt;style&gt;@keyframes x{}&lt;/style&gt;&lt;b style=&quot;animation-name:x&quot; onanimationstart=&quot;alert(1)&quot;&gt;&lt;/b&gt;';
    const animatedReplacement = `value=&quot;&quot;&gt;<span class="inline-block animate-pulse bg-pink-500/20 text-pink-300 border border-pink-500/50 rounded px-1 shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-500">&lt;style&gt;@keyframes x{}&lt;/style&gt;&lt;b style=&quot;animation-name:x&quot; onanimationstart=&quot;alert(1)&quot;&gt;&lt;/b&gt;</span>`;
    html = html.replace(breakoutTarget, animatedReplacement);
  }

  // Highlight Strings (The Trap) with an initial 3-second pulse animation
  html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g, (match) => {
    if (match.includes("animation-name") || match.includes("alert")) return match; 
    
    // Dynamic classes based on the highlightTrap state
    const trapClass = highlightTrap && match.length > 2 
      ? 'text-green-400 font-bold break-all animate-pulse drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] transition-all duration-500' 
      : 'text-green-400 font-bold break-all transition-all duration-500';
      
    return `<span class="${trapClass}">${match}</span>`;
  });
  
  html = html.replace(/([a-zA-Z0-9_-]+)=/g, '<span class="text-blue-300">$1</span>=');
  html = html.replace(/(&lt;\/?)([a-zA-Z0-9_-]+)/g, (match, p1, p2) => {
    if (p2 === 'style' || p2 === 'b') return match; 
    return `${p1}<span class="text-pink-400 font-bold">${p2}</span>`;
  });
  html = html.replace(/(&lt;!--.*?--&gt;)/g, '<span class="text-gray-500 italic">$1</span>');

  return <pre dangerouslySetInnerHTML={{ __html: html }} className="font-mono text-sm leading-relaxed whitespace-pre-wrap" />;
};

export default function ReflectedXss() {
  const [url, setUrl] = useState("https://applekart.local/search?q=airpods");
  const [searchQuery, setSearchQuery] = useState("airpods");
  const [isFetching, setIsFetching] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [iframeSource, setIframeSource] = useState("");
  
  // Lab States
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [minerStatus, setMinerStatus] = useState("Idle"); // Idle, Scanning, Complete
  const [isBreakout, setIsBreakout] = useState(false);
  const [highlightTrap, setHighlightTrap] = useState(false);
  
  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    executeRequest(url);
  }, []);

  // Form submit handles search box synchronization
  const handleUIRefresh = (e) => {
    e.preventDefault();
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('q', searchQuery);
      const newUrl = urlObj.toString();
      setUrl(newUrl);
      executeRequest(newUrl);
    } catch (err) {
      // Fallback if URL is malformed
      const newUrl = `https://applekart.local/search?q=${encodeURIComponent(searchQuery)}`;
      setUrl(newUrl);
      executeRequest(newUrl);
    }
  };

  const executeRequest = async (targetUrl = url) => {
    setIsFetching(true);
    setIframeSource("");
    setIsBreakout(false);
    
    try {
      const urlObj = new URL(targetUrl);
      const params = new URLSearchParams(urlObj.search);
      const q = params.get('q') || 'airpods';
      const debug = params.get('debug') || '';

      // Sync UI search box with URL state
      setSearchQuery(q);

      const exactPayload = '"><style>@keyframes x{}</style><b style="animation-name:x" onanimationstart="alert(1)"></b>';
      if (debug === exactPayload) setIsBreakout(true);

      const res = await fetch(`/api/search-xss?q=${encodeURIComponent(q)}&debug=${encodeURIComponent(debug)}`);
      const data = await res.json();
      
      setHtmlSource(data.htmlSource);
      
      // Trigger the 3-second green glow animation when HTML is rendered
      setHighlightTrap(true);
      setTimeout(() => setHighlightTrap(false), 3000);
      
      setTimeout(() => {
        setIframeSource(data.iframeSource);
      }, 300);
      
    } catch (err) {
      console.error("Simulation failed");
    } finally {
      setIsFetching(false);
    }
  };

  const runParamMiner = () => {
    setMinerStatus("Scanning");
    setTimeout(() => {
      setMinerStatus("Complete");
      // Automatically append the discovered parameter to bridge the gap to Step 2
      setUrl(prevUrl => {
        try {
          const urlObj = new URL(prevUrl);
          if (!urlObj.searchParams.has('debug')) {
            urlObj.searchParams.append('debug', '');
            return urlObj.toString();
          }
          return prevUrl;
        } catch (err) {
          return prevUrl;
        }
      });
    }, 2000);
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/check-xss-progress");
      const data = await res.json();
      if (data.complete) {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        alert("Exploit not detected. Verify that your input escaped the HTML attribute and executed JavaScript.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* 🌐 SIMULATED BROWSER ADDRESS BAR */}
      <div className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 max-w-7xl mx-auto gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 flex items-center bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition">
            <span className="text-gray-400 mr-2 text-sm">🔒</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeRequest()}
              className="w-full bg-transparent focus:outline-none text-sm text-gray-700 font-mono"
            />
          </div>
          <button onClick={() => executeRequest(url)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
            Send Request
          </button>
        </div>
      </div>

      {/* 🚀 HIDDEN EXECUTOR (This executes the XSS alert) */}
      {iframeSource && (
        <iframe 
          srcDoc={iframeSource} 
          title="xss-executor"
          sandbox="allow-scripts allow-same-origin allow-modals"
          style={{ width: 0, height: 0, border: 'none', position: 'absolute' }}
        />
      )}

      {/* 💻 MAIN SPLIT LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        
        {/* LEFT PANE: AppleKart UI */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">🛒 AppleKart</h1>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <form onSubmit={handleUIRefresh} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                  placeholder="Search products..."
                />
                <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">Search</button>
              </form>

              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg text-sm mb-6">
                Search results for: <strong>{searchQuery}</strong>
              </div>
              
              <div className="space-y-4 overflow-y-auto">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-xl">
                      {searchQuery.toLowerCase().includes('iphone') ? '📱' : '🎧'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm capitalize">Apple {searchQuery || 'Product'} (Gen {i})</h3>
                      <p className="text-blue-600 font-black mt-1 text-sm">₹{i === 1 ? '18,900' : '24,900'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Hacker Tools */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 🔍 PARAM MINER SIMULATOR */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-800 overflow-hidden flex flex-col">
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-2">
                <span className="text-lg">⛏️</span> Param Miner
              </span>
              <button 
                onClick={runParamMiner}
                disabled={minerStatus !== "Idle"}
                className="text-xs bg-orange-600/20 text-orange-400 hover:bg-orange-600/40 border border-orange-500/50 px-3 py-1 rounded transition disabled:opacity-50"
              >
                {minerStatus === "Scanning" ? "Scanning..." : "Start Scan"}
              </button>
            </div>
            <div className="p-4 bg-[#1e1e1e] font-mono text-xs text-gray-300 min-h-[100px] flex flex-col justify-center">
              {minerStatus === "Idle" && <div className="text-gray-500 text-center">Ready to analyze target URL for hidden parameters.</div>}
              {minerStatus === "Scanning" && <div className="animate-pulse text-yellow-400">Brute-forcing parameters... [14,592 / 85,000]</div>}
              {minerStatus === "Complete" && (
                <div className="text-green-400 animate-fade-in space-y-1">
                  <p>[+] Scan completed.</p>
                  <p className="font-bold text-pink-400 bg-pink-400/10 inline-block px-2 py-1 rounded border border-pink-500/30">
                    [!] Found hidden parameter: ?debug=
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 💻 DEVTOOLS PANEL */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-800 overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex justify-between items-center">
              <div className="flex gap-4">
                <button className="text-xs font-bold text-gray-400 hover:text-white transition">Network</button>
                <button className={`text-xs font-bold transition ${isDevToolsOpen ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>Elements</button>
              </div>
              {!isDevToolsOpen && (
                <button onClick={() => setIsDevToolsOpen(true)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition animate-pulse">
                  Inspect Page
                </button>
              )}
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-[#1e1e1e]">
              {!isDevToolsOpen ? (
                <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm text-center">
                  DOM Inspector is closed.<br/>Click 'Inspect Page' to view reflection.
                </div>
              ) : isFetching ? (
                <div className="text-gray-500 font-mono text-sm animate-pulse">Loading DOM elements...</div>
              ) : (
                <div className="animate-fade-in">
                  <HighlightHTML code={htmlSource} isBreakout={isBreakout} highlightTrap={highlightTrap} />
                </div>
              )}
            </div>
          </div>

          {/* 🧠 HACKER CONSOLE */}
          <div className="bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 text-center mt-auto">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Hacker Console</h3>
            
            {/* The satisfying mid-way success feedback */}
            {isBreakout && (
              <div className="mb-4 text-green-400 text-sm font-bold animate-fade-in-up flex items-center justify-center gap-2 bg-green-900/20 py-2 rounded-lg border border-green-500/30">
                <span className="text-lg">✔</span> Payload executed successfully
              </div>
            )}

            {!isBreakout && (
              <p className="text-gray-400 text-xs mb-4">
                Can you discover the hidden parameter and prove your input is reflected?
              </p>
            )}

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
              <h2 className="text-2xl font-black text-white tracking-wide">SUCCESS</h2>
              <p className="text-green-100 font-bold text-sm mt-1">Context Escaped</p>
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
                  Blind payload mat maro.<br/><br/>
                  Pehle dekho tumhara input page mein <strong>kahan reflect ho raha hai</strong>. Context samajhoge to payload khud mil jayega.
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