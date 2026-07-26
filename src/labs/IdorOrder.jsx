import { useState } from 'react';

export default function IdorOrder() {
  const [trackingData, setTrackingData] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Modals & State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flag, setFlag] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const trackOrder = async (orderId) => {
    setIsTracking(true);
    setTrackingData(null);
    
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch (err) {
      console.error("Tracking failed");
    } finally {
      setIsTracking(false);
    }
  };

  const executeCancel = async () => {
    setIsCancelling(true);
    try {
      // Realistic API pattern: ID is inside the JSON body
      const res = await fetch(`/api/orders/cancel`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: trackingData.id }) 
      });
      
      if (res.ok) {
        setShowCancelModal(false);
        if (trackingData) trackOrder(trackingData.id); // Refresh to see the red "Cancelled" timeline
      }
    } catch (err) {
      console.error("Cancellation failed");
    } finally {
      setIsCancelling(false);
    }
  };

  const verifyExploit = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/check-progress");
      const data = await res.json();
      if (data.complete) {
        setFlag(data.flag);
        setShowFlagModal(true);
      } else {
        alert("Exploit incomplete. You need to view AND cancel someone else's order first.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 bg-gray-100 min-h-screen font-sans text-gray-800">
      
      {/* Public Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">🛒 AppleKart</h1>
          <p className="text-gray-500 text-sm mt-1">Public Order Tracking Portal</p>
        </div>
        <div className="hidden sm:flex gap-4 text-sm font-bold text-gray-500">
          <span className="hover:text-black cursor-pointer transition">Support</span>
          <span className="hover:text-black cursor-pointer transition">Login</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Orders & Hacker Verification */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 px-1">Recent Orders</h2>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition cursor-pointer relative overflow-hidden" onClick={() => trackOrder("5001")}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2 py-1 rounded">#5001</span>
              <span className="text-xs text-gray-400 font-bold">Akash Verma</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Apple AirPods Pro (2nd Gen)</h3>
          </div>

          {/* Verification Section */}
          <div className="mt-8 bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 text-center animate-fade-in-up">
            <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-widest">Hacker Console</h3>
            <p className="text-gray-400 text-xs mb-4">Think you've successfully exploited the IDOR vulnerability?</p>
            <button 
              onClick={verifyExploit} 
              disabled={isVerifying}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded transition shadow-[0_0_15px_rgba(22,163,74,0.3)] disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Verify & Claim Flag"}
            </button>
          </div>
        </div>

        {/* Right Column: The Data Presentation */}
        <div className="md:col-span-8">
          {isTracking ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-pulse h-full">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div></div>
                <div className="space-y-4"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div>
              </div>
            </div>
          ) : trackingData ? (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in relative overflow-hidden h-full flex flex-col justify-between">
              
              <div>
                {/* Premium Victim Order Tags */}
                {trackingData.tags && trackingData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {trackingData.tags.map(tag => (
                      <span key={tag} className="bg-yellow-100 text-yellow-800 text-xs font-black px-2 py-1 rounded border border-yellow-200 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Order Details</h2>
                    <p className="text-gray-500 text-sm font-mono tracking-wide">ID: {trackingData.id} • {trackingData.tracking}</p>
                  </div>
                  {trackingData.status !== "Cancelled" && (
                    <button 
                      onClick={() => setShowCancelModal(true)}
                      className="bg-white border-2 border-red-100 text-red-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-50 hover:border-red-200 transition"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Product Info */}
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Item</p>
                    <p className="font-black text-gray-900 mb-1 text-lg">{trackingData.item}</p>
                    <p className="text-blue-600 font-black text-xl">{trackingData.price}</p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">{trackingData.payment}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Shipping To</p>
                    <p className="font-black text-gray-900 text-lg">{trackingData.customer}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{trackingData.address}</p>
                    <p className="text-sm font-mono text-gray-500 mt-2">{trackingData.phone}</p>
                  </div>
                </div>

                {/* Animated Timeline */}
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Tracking Timeline</p>
                  <div className="space-y-4">
                    {trackingData.timeline.map((event, index) => {
                      const isCancelled = event.includes("Cancelled");
                      return (
                        <div key={index} className="flex items-center text-sm font-bold text-gray-700 animate-fade-in-up">
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full mr-3 ${isCancelled ? 'bg-red-100 text-red-600 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-green-100 text-green-600 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}>
                            {isCancelled ? '✕' : '✓'}
                          </div>
                          <span className={isCancelled ? 'text-red-600 font-black' : ''}>{event}</span>
                        </div>
                      )
                    })}
                    {trackingData.status !== "Cancelled" && (
                      <div className="flex items-center text-sm font-bold text-gray-400 opacity-50">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full mr-3 bg-gray-100 border border-gray-300 text-[10px]">○</div>
                        Est: {trackingData.eta}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtle Realism Footer */}
              <div className="mt-8 flex gap-6 pt-6 border-t border-gray-100">
                <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition flex items-center">
                  📄 Download Invoice
                </button>
                <button className="text-sm font-bold text-gray-500 hover:text-gray-800 transition flex items-center">
                  🎧 Call Support (1800-XXX-XXXX)
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-full text-center text-gray-400 min-h-[400px]">
              <div className="text-5xl mb-4 opacity-50">📦</div>
              <p className="font-bold">Select an order to track delivery status.</p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-2">Cancel Order?</h3>
            <p className="text-gray-600 text-sm mb-6">This action is permanent and cannot be undone. Are you sure you want to cancel this order?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200 transition">Go Back</button>
              <button onClick={executeCancel} disabled={isCancelling} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                {isCancelling ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-green-600 p-6 text-center">
              <h2 className="text-2xl font-black text-white tracking-wide">IDOR EXPLOITED</h2>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-3 text-sm font-bold">Object ID Manipulation Confirmed</p>
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 font-mono text-green-600 font-black text-lg select-all">
                  {flag}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6">
                <p className="text-blue-800 font-bold mb-2 flex items-center text-sm uppercase tracking-wider">
                  <span className="mr-2 text-lg">🧠</span> Hacker Memory
                </p>
                <p className="text-blue-900 text-sm leading-relaxed font-medium">
                  Server ne sirf <strong>Order ID</strong> dekhi. Yeh check hi nahi ki order tumhara tha ya kisi aur ka. Isi mistake ko <strong>IDOR (Insecure Direct Object Reference)</strong> bolte hain.
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