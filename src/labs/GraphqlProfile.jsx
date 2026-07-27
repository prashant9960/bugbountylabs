import { useState, useEffect } from 'react';

// Upgraded Syntax Highlighter to create the glowing dopamine hit
const SyntaxHighlight = ({ data, highlightKeys = [] }) => {
  if (!data) return null;
  const jsonString = JSON.stringify(data, null, 2);
  
  const colored = jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = 'text-green-400'; 
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // Extract the exact key name without quotes and colon
          const rawKey = match.replace(/[":]/g, '');
          if (highlightKeys.includes(rawKey)) {
            // The massive visual payoff: Glowing red/pink for leaked internal fields
            cls = 'text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] font-bold';
          } else {
            cls = 'text-blue-400';
          }
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-orange-400';
      } else if (/null/.test(match)) {
        cls = 'text-gray-400';
      } else {
        cls = 'text-yellow-400';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
  return <pre dangerouslySetInnerHTML={{ __html: colored }} className="font-mono text-sm leading-relaxed" />;
};

export default function GraphqlProfile() {
  const [profileData, setProfileData] = useState(null);
  
  const [executedQuery, setExecutedQuery] = useState("");
  const [rawResponse, setRawResponse] = useState(null);
  const [leakedKeys, setLeakedKeys] = useState([]);
  const [queryStatus, setQueryStatus] = useState("Idle");
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setQueryStatus("Awaiting Network...");
    
    const defaultQuery = `query {
  me {
    name
    email
    membership

    # 💡 Intercept this request in Burp
    # and discover hidden fields here
  }
}`;
    
    setExecutedQuery(defaultQuery);

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: defaultQuery })
      });
      
      const data = await res.json();
      
      setQueryStatus("Executing query...");
      setTimeout(() => {
        setQueryStatus("Receiving response...");
        setTimeout(() => {
          setQueryStatus("Complete");
          setRawResponse(data);
          
          if (data.extensions?.providedQuery) {
            setExecutedQuery(data.extensions.providedQuery);
          }
          if (data.extensions?.leakedFields) {
            setLeakedKeys(data.extensions.leakedFields);
          }
          
          // UI ignores extra data. UI != Backend.
          if (data.data?.me) {
            setProfileData({
              name: data.data.me.name,
              email: data.data.me.email,
              membership: data.data.me.membership
            });
          }
        }, 600);
      }, 500);
      
    } catch (err) {
      setQueryStatus("Error");
    }
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/check-graphql-progress");
      const data = await res.json();
      if (data.complete) {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        alert("Hidden backend fields not detected.\n\nTry requesting fields like:\n- savedCards\n- accountFlags\n- fraudScore\n- warehouseOverride");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-100 min-h-screen font-sans text-gray-800 flex flex-col">
      
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">🛒 AppleKart</h1>
          <p className="text-gray-500 text-sm mt-1">Customer Account Portal</p>
        </div>
        <div className="hidden sm:flex gap-4 text-sm font-bold text-gray-500">
          <span className="hover:text-black cursor-pointer transition">Orders</span>
          <span className="hover:text-black cursor-pointer transition">Support</span>
          <span className="hover:text-black cursor-pointer transition">Logout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Fixed UI & Controls */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 px-1">My Profile</h2>
          
          {!profileData ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black shadow-sm">
                  {profileData.name ? profileData.name.charAt(0) : "U"}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{profileData.name}</h3>
                  <p className="text-gray-500 text-sm">{profileData.email}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-blue-900 font-bold">{profileData.membership}</p>
                </div>
                <div className="text-3xl">🌟</div>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 text-center mt-auto">
            <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-widest">Hacker Console</h3>
            <p className="text-gray-400 text-xs mb-4">Did you expose the hidden backend fields?</p>
            <button 
              onClick={runVerification} 
              disabled={isVerifying}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded transition shadow-[0_0_15px_rgba(22,163,74,0.3)] disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Validate Query"}
            </button>
          </div>
        </div>

        {/* Right Column: GraphQL Dual-Pane */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-2 px-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              Network Inspector
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              {queryStatus === "Executing query..." && <span className="text-yellow-600 animate-pulse">{queryStatus}</span>}
              {queryStatus === "Receiving response..." && <span className="text-blue-600 animate-pulse">{queryStatus}</span>}
              {queryStatus === "Complete" && <span className="text-green-600">{queryStatus}</span>}
            </div>
          </div>
          
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-800 overflow-hidden flex flex-col h-[700px] relative">
            
            {/* ⚠️ THE EXPOSURE BADGE */}
            {leakedKeys.length > 0 && queryStatus === "Complete" && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in-up">
                <div className="bg-black/80 border border-green-500/50 text-green-400 text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2 backdrop-blur-sm">
                  <span className="animate-pulse text-sm">⚠️</span> Excessive Data Exposure Detected
                </div>
              </div>
            )}

            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-xs font-mono text-gray-400">POST /api/graphql</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Pane: Sent Query (Now dynamically matches Burp) */}
              <div className="w-5/12 border-r border-gray-700 bg-[#1e1e1e] flex flex-col">
                <div className="bg-[#252526] text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 border-b border-gray-700">
                  Request Query
                </div>
                <div className="p-4 overflow-y-auto flex-1 text-gray-300 font-mono text-sm leading-relaxed">
                  <pre>{executedQuery}</pre>
                </div>
              </div>

              {/* Right Pane: Exploding Response */}
              <div className="w-7/12 bg-[#1e1e1e] flex flex-col">
                <div className="bg-[#252526] text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 border-b border-gray-700">
                  Server Response
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {!rawResponse || queryStatus !== "Complete" ? (
                    <div className="flex h-full items-center justify-center text-gray-600 font-mono text-sm">
                      {queryStatus === "Idle" ? "Ready" : "Awaiting payload..."}
                    </div>
                  ) : (
                    <div className="animate-fade-in-up">
                      <SyntaxHighlight data={rawResponse} highlightKeys={leakedKeys} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-green-600 p-6 text-center">
              <h2 className="text-2xl font-black text-white tracking-wide">BACKEND EXPOSED SUCCESSFULLY</h2>
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
                  Frontend sirf 3 fields maang raha tha. Server ne poocha hi nahi ki aur kya dena chahiye.<br/><br/>
                  Client ne jo maanga... <strong className="text-black">server ne sab de diya.</strong>
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