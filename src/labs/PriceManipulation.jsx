// src/labs/PriceManipulation.jsx
import { useState, useEffect } from 'react';

const PRODUCTS = [
  { id: 1, name: "Apple iPhone 17", price: 80000, stock: 3 },
  { id: 2, name: "AirPods Pro (2nd Gen)", price: 10000, stock: 10 },
  { id: 3, name: "AppleKart Premium Membership", price: 499, stock: 999999 }
];

const CURRENCIES = {
  "INR": 1,
  "USD": 0.012,
  "EUR": 0.011
};

const CASES = [
  { id: "PRICE", lockedTitle: "CASE 01", title: "PRICE TAMPERING", lesson: "The server trusted the price sent by the browser." },
  { id: "COUPON", lockedTitle: "CASE 02", title: "COUPON LOGIC FLAW", lesson: "The server checked coupon validity, but not coupon usage." },
  { id: "DELIVERY", lockedTitle: "CASE 03", title: "DELIVERY MANIPULATION", lesson: "The client was allowed to choose its own delivery fee." },
  { id: "QUANTITY", lockedTitle: "CASE 04", title: "NEGATIVE QUANTITY", lesson: "The server failed to enforce a positive quantity." },
  { id: "CURRENCY", lockedTitle: "CASE 05", title: "EXCHANGE RATE BYPASS", lesson: "The server trusted the exchange rate supplied by the client." }
];

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScNP83cceHBL4nKzLltUnv1mDB0JvYMolo7nzIpeq4acDeJhA/viewform";

export default function PriceManipulation() {
  const [quantities, setQuantities] = useState({ 1: 1, 2: 1, 3: 1 });
  const [coupon, setCoupon] = useState("");
  const [currency, setCurrency] = useState("INR");
  
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});
  const [copyStatus, setCopyStatus] = useState("Copy Flag");
  
  // Cinematic Sequence State
  // 0: Normal Receipt, 1: "Wait...", 2: Evidence, 3: Case Solved / Flag
  const [receiptSequence, setReceiptSequence] = useState(0);

  // Load local progress safely
  useEffect(() => {
    const saved = localStorage.getItem("applekart_progress");
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.warn("Corrupted progress state reset.");
        localStorage.removeItem("applekart_progress");
        setProgress({});
      }
    }
  }, []);

  // Functional state update prevents race conditions in rapid solves
  const saveProgress = (caseId, flag) => {
    setProgress(prev => {
      const next = {
        ...prev,
        [caseId]: { solved: true, flag }
      };
      localStorage.setItem("applekart_progress", JSON.stringify(next));
      return next;
    });
  };

  const handleCopy = async (flagText) => {
    try {
      await navigator.clipboard.writeText(flagText);
      setCopyStatus("Copied!");
    } catch (err) {
      setCopyStatus("Press and hold to copy");
    }
    setTimeout(() => setCopyStatus("Copy Flag"), 2500);
  };

  const generateOrderId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().split('-')[0];
    }
    return Math.floor(Math.random() * 1000000).toString(16);
  };

  // Cinematic payoff sequence with "Fast Forward" for already-solved cases
  useEffect(() => {
    if (receipt?.solvedData && receiptSequence === 0) {
      const isRepeatSolve = progress[receipt.solvedData.caseId]?.solved;

      if (isRepeatSolve) {
        // Fast sequence for returning hunters
        setReceiptSequence(2);
        const t1 = setTimeout(() => setReceiptSequence(3), 800);
        return () => clearTimeout(t1);
      } else {
        // Full dramatic sequence for first-time solves
        const t1 = setTimeout(() => setReceiptSequence(1), 800);  // Wait...
        const t2 = setTimeout(() => setReceiptSequence(2), 1500); // Evidence
        const t3 = setTimeout(() => setReceiptSequence(3), 2500); // Case Solved + Flag
        
        saveProgress(receipt.solvedData.caseId, receipt.solvedData.flag);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
      }
    }
    
    if (receipt && !receipt.solvedData && receiptSequence === 0) {
       const t1 = setTimeout(() => setReceiptSequence(1), 800);
       return () => clearTimeout(t1);
    }
  }, [receipt]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReceiptSequence(0);

    const payload = {
      order_id: generateOrderId(), 
      products: [
        { id: 1, qty: Number(quantities[1]), price: PRODUCTS[0].price, stock: PRODUCTS[0].stock },
        { id: 2, qty: Number(quantities[2]), price: PRODUCTS[1].price, stock: PRODUCTS[1].stock },
        { id: 3, qty: Number(quantities[3]), price: PRODUCTS[2].price, stock: PRODUCTS[2].stock }
      ],
      shipping_fee: 500,
      tax: 0,
      coupon: coupon,
      currency: currency,
      conversion_rate: CURRENCIES[currency] // Included naturally so Burp sees it
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.error) {
        alert("Transaction Error: " + data.error);
        setReceipt(null);
      } else {
        setReceipt(data);
      }
    } catch (err) {
      alert("Checkout failed. Check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const resetOrder = () => {
    setQuantities({ 1: 1, 2: 1, 3: 1 });
    setCoupon("");
    setCurrency("INR");
    setReceipt(null);
    setReceiptSequence(0);
    setCopyStatus("Copy Flag");
  };

  const resetAllProgress = () => {
    if (confirm("Are you sure you want to reset all solved cases? This cannot be undone.")) {
      setProgress({});
      localStorage.removeItem("applekart_progress");
      resetOrder();
    }
  }

  // Strictly filter only true CASE ids to prevent injection inflation
  const solvedCount = CASES.filter(c => progress[c.id]?.solved).length;
  const allCasesSolved = solvedCount === CASES.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT PANEL - APPLEKART STORE */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 relative">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">AppleKart</h1>
                <p className="text-gray-500 text-sm mt-1">Premium Apple products.</p>
              </div>
            </div>

            {!receipt ? (
              <form onSubmit={handleCheckout} className="space-y-5">
                {PRODUCTS.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border border-gray-100 p-4 rounded-xl hover:shadow-md transition bg-gray-50">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">{item.name}</h2>
                      <p className="text-gray-500 text-sm font-medium">₹{item.price.toLocaleString()} <span className="text-gray-400">| In Stock: {item.stock === 999999 ? "∞" : item.stock}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-wide hidden sm:block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={quantities[item.id]}
                        onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })}
                        className="border border-gray-300 p-2 rounded-lg w-16 text-center font-bold focus:ring-2 focus:ring-black outline-none transition"
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Promo Code</label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-black outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-black outline-none transition bg-white"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-xl text-lg font-black hover:bg-gray-800 transition shadow-lg disabled:opacity-50 mt-4"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col space-y-4 relative min-h-[600px] sm:min-h-[500px]">
                
                {/* 1. Base Receipt */}
                <div className={`transition-all duration-700 ${receiptSequence >= 1 && receipt.solvedData ? 'opacity-10 blur-[2px] scale-[0.98]' : 'opacity-100 scale-100'}`}>
                  <div className="text-center border-b pb-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                    <h2 className="text-3xl font-black text-gray-900">Order Confirmed</h2>
                    <p className="text-sm text-gray-500 font-mono mt-2">Order ID: #{receipt.orderId}</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl space-y-3 font-mono text-sm border border-gray-100 mt-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{receipt.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{receipt.shippingFee.toFixed(2)}</span>
                    </div>
                    {receipt.discount !== 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Discount</span>
                        <span>- {receipt.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between border-t pt-4 text-xl font-black ${receipt.finalTotal < 0 ? 'text-red-500' : 'text-black'}`}>
                      <span>Total Paid ({receipt.currency})</span>
                      <span>{receipt.finalTotal < 0 ? '-' : ''} {Math.abs(receipt.finalTotal).toFixed(2)}</span>
                    </div>
                    {receipt.finalTotal < 0 && (
                      <div className="text-right text-xs text-red-500 font-bold mt-1 animate-pulse">
                        Negative balance anomaly detected
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Wait... */}
                {receiptSequence === 1 && receipt.solvedData && (
                  <div className="absolute inset-x-0 top-0 bottom-16 flex items-center justify-center z-10 animate-fade-in bg-white/50 backdrop-blur-sm rounded-xl">
                    <h2 className="text-4xl font-black text-gray-900 tracking-widest uppercase bg-white/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl">Wait...</h2>
                  </div>
                )}

                {/* 3. Evidence Panel (Scrollable on mobile to prevent missing buttons) */}
                {receiptSequence >= 2 && receipt.solvedData && (
                  <div className="absolute inset-x-0 top-0 bottom-16 bg-white/95 backdrop-blur-md z-20 overflow-y-auto animate-fade-in-up rounded-xl">
                    <div className="min-h-full flex flex-col items-center justify-start sm:justify-center p-4">
                      
                      {/* my-auto ensures the content stays centered but pushes boundaries safely when scrolling on small screens */}
                      <div className="my-auto w-full max-w-sm flex flex-col items-center">
                        <p className="text-red-500 font-black tracking-widest uppercase mb-2 text-sm text-center">Suspicious Activity</p>
                        
                        <div className="w-full bg-gray-900 text-gray-300 rounded-xl p-5 sm:p-6 font-mono text-xs sm:text-sm shadow-2xl border border-gray-800 text-left mb-6 break-words">
                          <p className="text-white border-b border-gray-700 pb-2 mb-4 font-bold uppercase">{receipt.solvedData.evidence.title}</p>
                          
                          {receipt.solvedData.evidence.product && <p className="mb-1">Product: <span className="text-gray-400">{receipt.solvedData.evidence.product}</span></p>}
                          {receipt.solvedData.evidence.before && <p className="mb-1">Expected: <span className="text-gray-500 line-through">{receipt.solvedData.evidence.before}</span></p>}
                          {receipt.solvedData.evidence.after !== undefined && <p className="mb-1">Processed: <span className="text-red-400 font-bold">{receipt.solvedData.evidence.after}</span></p>}
                          {receipt.solvedData.evidence.impact && <p className="mt-3 text-[10px] sm:text-xs border-t border-gray-800 pt-3 text-gray-400 leading-relaxed">{receipt.solvedData.evidence.impact}</p>}
                          
                          {receipt.solvedData.evidence.requested !== undefined && <p className="mb-1">Requested: <span className="text-red-400 font-bold">{receipt.solvedData.evidence.requested}</span></p>}
                          {receipt.solvedData.evidence.available !== undefined && <p className="mb-1">Available: <span className="text-gray-400">{receipt.solvedData.evidence.available}</span></p>}
                          
                          {receipt.solvedData.evidence.currency && <p className="mb-1">Currency: <span className="text-gray-400">{receipt.solvedData.evidence.currency}</span></p>}
                          {receipt.solvedData.evidence.expected !== undefined && <p className="mb-1">Expected Rate: <span className="text-gray-400">{receipt.solvedData.evidence.expected}</span></p>}
                          {receipt.solvedData.evidence.applied && <p className="mb-1">Applied Rate: <span className="text-red-400 font-bold">{receipt.solvedData.evidence.applied}</span></p>}
                          
                          {receipt.solvedData.evidence.policy && <p className="mb-1">Policy: <span className="text-gray-400">{receipt.solvedData.evidence.policy}</span></p>}
                        </div>

                        {/* 4. Case Solved & Flag Unlock */}
                        {receiptSequence >= 3 && (
                          <div className="w-full animate-fade-in-up text-center">
                            <div className="bg-green-50 border-2 border-green-500 p-4 rounded-xl shadow-lg mb-4">
                              <h3 className="text-green-700 font-black text-lg sm:text-xl uppercase tracking-widest mb-1">Case Solved</h3>
                              <p className="text-green-600 text-xs sm:text-sm font-bold">Evidence Verified.</p>
                            </div>
                            
                            <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 font-mono text-gray-800 font-black text-sm sm:text-lg select-all shadow-inner mb-4 break-all">
                              {receipt.solvedData.flag}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button 
                                onClick={() => handleCopy(receipt.solvedData.flag)}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-black font-bold py-3 rounded-lg transition shadow-sm"
                              >
                                {copyStatus}
                              </button>
                              <a 
                                href={GOOGLE_FORM_URL} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center"
                              >
                                Submit Flag ➔
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Normal Process - No Vulnerability Triggered */}
                {receiptSequence >= 1 && !receipt.solvedData && (
                   <div className="absolute inset-x-0 top-0 bottom-16 flex flex-col items-center justify-center z-10 animate-fade-in bg-white/95 backdrop-blur-md rounded-xl">
                     <h2 className="text-2xl font-black text-gray-900 mb-2">No anomaly detected.</h2>
                     <p className="text-gray-500 font-bold text-sm">Try another parameter.</p>
                   </div>
                )}

                {/* Start New Order strictly anchored to the bottom and placed ON TOP of absolute overlays */}
                <div className="mt-auto pt-4 relative z-30">
                  <button
                    onClick={resetOrder}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition border border-gray-200 shadow-sm"
                  >
                    Start New Order
                  </button>
                </div>

              </div>
            )}
            
          </div>
          
          <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Practice Lab • Authorized Testing Only
          </div>
        </div>

        {/* RIGHT PANEL - THE HUNTER DASHBOARD */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 text-white">
            
            {allCasesSolved ? (
              <div className="mb-6 bg-green-900/30 border border-green-500/50 p-4 rounded-xl text-center">
                <h3 className="text-lg font-black text-green-400 tracking-widest uppercase mb-1">AppleKart Case Board</h3>
                <p className="text-white font-bold mb-1">{solvedCount} / {CASES.length} CASES SOLVED</p>
                <p className="text-gray-300 text-sm font-medium">You've found 5 business-logic flaws.</p>
                <p className="text-gray-500 text-xs mt-1">There may be more...</p>
              </div>
            ) : (
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                AppleKart Case Board
              </h3>
            )}
            
            <div className="space-y-4">
              {CASES.map(c => {
                const isSolved = progress[c.id]?.solved;
                return (
                  <div key={c.id} className={`p-4 rounded-xl border transition-all duration-500 ${isSolved ? 'bg-gray-800/80 border-green-500/50' : 'bg-black/50 border-gray-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold tracking-wide ${isSolved ? 'text-white' : 'text-gray-500'}`}>
                        {isSolved ? c.title : `${c.lockedTitle} - ?`}
                      </h4>
                      {isSolved ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-1 rounded">SOLVED</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 bg-gray-800 px-2 py-1 rounded">INVESTIGATE</span>
                      )}
                    </div>
                    
                    {isSolved ? (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        <p className="text-xs text-gray-300 leading-relaxed font-medium">{c.lesson}</p>
                        <div className="bg-black/80 p-2 rounded text-xs font-mono text-green-400 border border-green-900/50 break-all select-all">
                          {progress[c.id].flag}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 italic font-medium">Find the mistake.</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-800">
              <button onClick={resetAllProgress} className="w-full text-xs font-bold text-gray-500 hover:text-white transition uppercase tracking-widest">
                Reset All Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        
        /* Custom scrollbar to keep evidence panel clean on Windows/Android */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
      `}</style>
    </div>
  );
}