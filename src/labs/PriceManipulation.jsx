import { useState } from 'react';

const PRODUCTS = [
  { id: 1, name: "Apple iPhone 17", price: 80000, stock: 3 },
  { id: 2, name: "AirPods Pro (2nd Gen)", price: 10000, stock: 10 },
  { id: 3, name: "Premium iOS Hacking E-Book (PDF)", price: 0, stock: "UNLIMITED" }
];

export default function PriceManipulation() {
  const [quantities, setQuantities] = useState({ 1: 1, 2: 1, 3: 1 });
  const [coupon, setCoupon] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Payload updated to expose 'stock' to the client, removing client-side 'coupon_value'
    const payload = {
      order_id: Math.floor(Math.random() * 100000),
      products: [
        { id: 1, qty: Number(quantities[1]), price: PRODUCTS[0].price, stock: PRODUCTS[0].stock },
        { id: 2, qty: Number(quantities[2]), price: PRODUCTS[1].price, stock: PRODUCTS[1].stock },
        { id: 3, qty: Number(quantities[3]), price: PRODUCTS[2].price, stock: PRODUCTS[2].stock }
      ],
      shipping_fee: 500,
      tax: 0,
      coupon: coupon,
      currency: "INR",
      conversion_rate: 1
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.error) {
        alert("Error: " + data.error);
        setReceipt(null);
      } else {
        setReceipt(data);
      }
    } catch (err) {
      alert("Checkout failed. Check server console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gray-100 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">🛒 AppleKart</h1>
        <p className="text-gray-500 mb-6">Premium Apple products — limited time deals</p>

        {!receipt ? (
          <form onSubmit={handleCheckout} className="space-y-6">
            {PRODUCTS.map((item) => (
              <div key={item.id} className="border p-4 rounded-lg bg-white shadow-sm">
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-gray-600">Price: ₹{item.price} | Stock: {item.stock}</p>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-sm">Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[item.id]}
                    onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })}
                    className="border p-2 rounded w-20"
                  />
                </div>
              </div>
            ))}

            <div>
              <input
                type="text"
                placeholder="Promo code (Hint: try WELCOME10)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="border p-2 w-full rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg text-lg font-bold hover:bg-gray-800 transition"
            >
              {loading ? "Processing..." : "Place Order (Buy Now)"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center border-b pb-4">
              <h2 className="text-3xl font-black text-green-600">✅ Order Confirmed</h2>
              <p className="text-sm text-gray-500">Order ID: #{receipt.orderId}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">₹{receipt.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-bold">₹{receipt.shippingFee}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount Applied:</span>
                  <span className="font-bold">- ₹{receipt.discount}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-xl font-black">
                <span>Total Paid:</span>
                <span className={receipt.isVulnerable ? "text-green-600" : "text-gray-900"}>
                  ₹{receipt.finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {receipt.isVulnerable && (
              <div className="bg-red-50 border-2 border-red-500 p-4 rounded-lg text-center animate-pulse">
                <p className="text-red-600 font-black">⚠️ CRITICAL LOGIC FLAW TRIGGERED</p>
                <p className="text-red-500 text-sm">Negative / Zero payment processed by backend!</p>
              </div>
            )}

            <button
              onClick={() => setReceipt(null)}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-bold"
            >
              ← Try Another Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}