const TRUSTED_PRODUCTS = [
    { id: 1, name: "Apple iPhone 17", price: 80000, stock: 3, type: "physical" },
    { id: 2, name: "AirPods Pro (2nd Gen)", price: 10000, stock: 10, type: "physical" },
    { id: 3, name: "Premium iOS Hacking E-Book (PDF)", price: 0, stock: "UNLIMITED", type: "digital" }
  ];
  
  // REALISTIC FIX 2: Server-side Coupon Database
  const VALID_COUPONS = {
    "WELCOME10": 0.10,
    "SAVE20": 0.20,
    "HACKER50": 0.50
  };
  
  // REALISTIC FIX 5: Server-side Currency Verification
  const CURRENCY_RATES = {
    "INR": 1,
    "USD": 0.012,
    "EUR": 0.011
  };
  
  export default function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    let subtotal = 0;
    let orderId = req.body.order_id || Math.floor(Math.random() * 100000);
    let errors = [];
  
    // REALISTIC FIX 4: Stock & Quantity Manipulation
    req.body.products?.forEach(p => {
      const realProduct = TRUSTED_PRODUCTS.find(t => t.id === p.id);
      if (!realProduct) return;
  
      // Flaw: Developer checks stock, but mistakenly trusts the client's 'stock' parameter if it exists
      const stockToCheck = p.stock !== undefined ? p.stock : realProduct.stock;
      
      if (stockToCheck !== "UNLIMITED" && p.qty > stockToCheck) {
        errors.push(`Not enough stock for ${realProduct.name}.`);
      } else {
        // REALISTIC FIX 1: Price Tampering (Still vulnerable, trusts client price)
        // Also vulnerable to negative quantity math
        subtotal += (p.qty || 0) * (p.price !== undefined ? p.price : realProduct.price);
      }
    });
  
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }
  
    let total = subtotal;
  
    // REALISTIC FIX 3: Negative delivery pricing (trusts client input)
    total += (req.body.shipping_fee || 0);
    total += (req.body.tax || 0);
  
    // REALISTIC FIX 2: Coupon Stacking (Validates coupon, but allows array loops)
    let discount = 0;
    let appliedCoupons = [];
    
    let coupons = [];
    try {
      // If the attacker sends a JSON array string, parse it
      coupons = typeof req.body.coupon === 'string' && req.body.coupon.startsWith('[') 
          ? JSON.parse(req.body.coupon) 
          : [req.body.coupon];
    } catch {
      if (req.body.coupon) coupons = [req.body.coupon];
    }
  
    coupons.forEach(c => {
      // Flaw: Checks if coupon is valid, but applies it as many times as it appears in the array
      if (VALID_COUPONS[c]) {
        discount += total * VALID_COUPONS[c];
        appliedCoupons.push(c);
      }
    });
  
    total -= discount;
  
    // REALISTIC FIX 5: Currency Manipulation
    let finalCurrency = req.body.currency || "INR";
    let realRate = CURRENCY_RATES[finalCurrency];
    
    if (realRate) {
      // Flaw: Verifies the currency exists, but trusts the client's conversion_rate override
      let appliedRate = req.body.conversion_rate || realRate;
      total *= appliedRate;
    } else {
      return res.status(400).json({ error: "Invalid currency selected." });
    }
  
    return res.status(200).json({
      success: true,
      orderId,
      subtotal,
      shippingFee: req.body.shipping_fee || 0,
      discount,
      appliedCoupons,
      finalTotal: total,
      products: req.body.products,
      rawPayload: req.body,
      isVulnerable: total <= 0
    });
  }