// backend/checkout.js

// Server-side case tokens (Hardcoded unguessable strings)
const FLAGS = {
  PRICE: "j9V2kP7xM4nR8qL5",
  COUPON: "t3W8zR2mL7xK9pQ4",
  DELIVERY: "F5qN9pX2mL8rK4w7",
  QUANTITY: "c8V4nL9pM2xR7qK3",
  CURRENCY: "X2mL7pR4kQ9vN5x8"
};

// Authoritative Server-Side Data
const TRUSTED_PRODUCTS = [
  { id: 1, name: "Apple iPhone 17", price: 80000, stock: 3 },
  { id: 2, name: "AirPods Pro (2nd Gen)", price: 10000, stock: 10 },
  { id: 3, name: "AppleKart Premium Membership", price: 499, stock: 999999 } 
];

const VALID_COUPONS = {
  "WELCOME10": 0.10,
  "SAVE20": 0.20,
  "HACKER50": 0.50
};

const CURRENCY_RATES = {
  "INR": 1,
  "USD": 0.012,
  "EUR": 0.011
};

// Strict Numeric Parsing: Prevents JS coercion tricks (booleans, arrays, objects, empty strings, null)
const getNum = (val, fallback, fieldName, formatErrors, mustBeInt = false) => {
  if (val === undefined) return fallback;
  
  if (val === null) {
    formatErrors.push(`Invalid format for ${fieldName}.`);
    return fallback;
  }
  
  if (typeof val === 'boolean' || typeof val === 'object' || Array.isArray(val)) {
    formatErrors.push(`Invalid format for ${fieldName}.`);
    return fallback;
  }
  
  if (typeof val === 'string' && val.trim() === '') {
    formatErrors.push(`Invalid format for ${fieldName}.`);
    return fallback;
  }
  
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    formatErrors.push(`Invalid format for ${fieldName}.`);
    return fallback;
  }

  if (mustBeInt && !Number.isInteger(num)) {
    formatErrors.push(`${fieldName} must be a whole number.`);
    return fallback;
  }
  
  return num;
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let subtotal = 0;
  let orderId = typeof req.body.order_id === 'string' || typeof req.body.order_id === 'number' 
    ? String(req.body.order_id).substring(0, 8) 
    : Math.floor(Math.random() * 100000);
    
  let formatErrors = [];
  let businessErrors = [];
  
  // Isolate cases: prevent one request from solving multiple cases accidentally
  let triggeredCases = new Set();
  let evidenceMap = {};

  // 1 & 4. Process Products
  if (!req.body.products || !Array.isArray(req.body.products)) {
    formatErrors.push("Products must be provided as an array.");
  } else if (req.body.products.length === 0) {
    formatErrors.push("Order must contain at least one product.");
  } else {
    let seenProductIds = new Set();

    req.body.products.forEach((p, index) => {
      if (typeof p !== 'object' || p === null || Array.isArray(p)) {
        formatErrors.push(`Invalid product object at index ${index}.`);
        return;
      }

      const rawId = getNum(p.id, -1, `product[${index}].id`, formatErrors, true);
      const realProduct = TRUSTED_PRODUCTS.find(t => t.id === rawId);
      
      if (!realProduct) {
        formatErrors.push(`Unknown product ID at index ${index}.`);
        return;
      }

      if (seenProductIds.has(rawId)) {
        businessErrors.push(`Duplicate product detected: ${realProduct.name}.`);
        return;
      }
      seenProductIds.add(rawId);

      const requestQty = getNum(p.qty, 0, `product[${index}].qty`, formatErrors, true);

      // Cleanly reject 0. (Normal UI enforces positive numbers, exploit utilizes qty < 0).
      if (requestQty === 0) {
        businessErrors.push(`Quantity for ${realProduct.name} must be non-zero.`);
        return;
      }

      // VULNERABILITY 04: NEGATIVE QUANTITY LOGIC
      if (requestQty < 0) {
        triggeredCases.add("QUANTITY");
        if (!evidenceMap["QUANTITY"]) {
          const impact = requestQty * realProduct.price;
          evidenceMap["QUANTITY"] = { 
            title: "Negative Quantity Accepted", 
            before: "Positive Integer", 
            after: requestQty,
            impact: `Server calculated: ₹${realProduct.price.toLocaleString()} × ${requestQty} = ₹${impact.toLocaleString()}` 
          };
        }
      }

      // Enforce true server-side stock against the quantity (no client stock trust)
      if (requestQty > realProduct.stock) {
        businessErrors.push(`Not enough stock for ${realProduct.name}.`);
      } else {
        // VULNERABILITY 01: PRICE INTEGRITY
        const clientPrice = getNum(p.price, realProduct.price, `product[${index}].price`, formatErrors, false);
        
        if (clientPrice !== realProduct.price && clientPrice >= 0 && clientPrice < realProduct.price && requestQty > 0) {
          triggeredCases.add("PRICE");
          if (!evidenceMap["PRICE"]) evidenceMap["PRICE"] = { title: "Price Tampering Detected", product: realProduct.name, before: `₹${realProduct.price}`, after: `₹${clientPrice}` };
        }
        subtotal += requestQty * clientPrice;
      }
    });
  }

  // VULNERABILITY 03: DELIVERY LOGIC
  const shippingFee = getNum(req.body.shipping_fee, 500, "shipping_fee", formatErrors, false);
  if (shippingFee < 0) { 
    triggeredCases.add("DELIVERY");
    evidenceMap["DELIVERY"] = { title: "Delivery Fee Bypass", before: "₹500", after: `₹${shippingFee}` };
  }
  
  // Tax validation (blocks free-money bugs outside the intended scope)
  const taxAmount = getNum(req.body.tax, 0, "tax", formatErrors, false);
  if (taxAmount < 0) {
    businessErrors.push("Invalid tax amount.");
  }
  
  let total = subtotal + shippingFee + taxAmount;

  // VULNERABILITY 02: COUPON RULES
  let discountMultiplier = 0;
  let appliedCoupons = [];
  let coupons = [];
  
  if (Array.isArray(req.body.coupon)) {
    coupons = req.body.coupon;
  } else if (typeof req.body.coupon === 'string' && req.body.coupon.startsWith('[')) {
    try { 
      coupons = JSON.parse(req.body.coupon); 
    } catch {
      formatErrors.push("Invalid coupon JSON format.");
    }
  } else if (req.body.coupon) {
    coupons = [req.body.coupon];
  }

  // Strict Coupon Validation (Prevents non-string exploitation)
  if (!Array.isArray(coupons)) {
    formatErrors.push("Invalid coupon format.");
    coupons = [];
  } else if (coupons.some(c => typeof c !== 'string')) {
    formatErrors.push("Coupons must be strings.");
    coupons = [];
  }

  // Deduplicate: Forces learner to use DIFFERENT valid coupons (e.g. WELCOME10 + SAVE20)
  let uniqueCoupons = [...new Set(coupons)];
  uniqueCoupons = uniqueCoupons.slice(0, 3); 

  let validCount = 0;
  uniqueCoupons.forEach(c => {
    // Safe lookup utilizing prototype protection
    if (Object.prototype.hasOwnProperty.call(VALID_COUPONS, c)) {
      discountMultiplier += VALID_COUPONS[c];
      appliedCoupons.push(c);
      validCount++;
    }
  });

  // Cap the total discount to 80% to prevent cartoonish negative totals
  discountMultiplier = Math.min(discountMultiplier, 0.80);

  if (validCount > 1) {
    triggeredCases.add("COUPON");
    evidenceMap["COUPON"] = { title: "Coupon Policy Bypassed", applied: appliedCoupons.join(", "), policy: "1 coupon maximum" };
  }

  let discountAmount = total * discountMultiplier;
  total -= discountAmount;

  // VULNERABILITY 05: CURRENCY LOGIC
  let currencyCode = "INR";
  if (req.body.currency !== undefined && req.body.currency !== null) {
    if (typeof req.body.currency !== 'string') {
      formatErrors.push("Invalid format for currency.");
    } else {
      currencyCode = req.body.currency;
    }
  }

  // Safe lookup utilizing prototype protection
  let realRate = Object.prototype.hasOwnProperty.call(CURRENCY_RATES, currencyCode) 
    ? CURRENCY_RATES[currencyCode] 
    : undefined;
  
  if (realRate !== undefined) {
    let clientRate = getNum(req.body.conversion_rate, realRate, "conversion_rate", formatErrors, false);
    
    if (clientRate <= 0) {
      businessErrors.push("Invalid conversion rate.");
    } else {
      // Changing the rate while preserving a valid currency unlocks the case
      if (currencyCode !== "INR" && clientRate !== realRate) {
        triggeredCases.add("CURRENCY");
        evidenceMap["CURRENCY"] = { title: "Exchange Rate Manipulation", currency: currencyCode, applied: clientRate, expected: realRate };
      }
      total *= clientRate;
    }
  } else {
    businessErrors.push("Invalid currency selected.");
  }

  // 1. Strictly block malformed data (NaN, arrays, objects, nulls) regardless of exploits
  if (formatErrors.length > 0) {
    return res.status(400).json({ error: formatErrors.join(" ") });
  }

  // 2. Prevent mega-requests: Enforce one investigation at a time
  if (triggeredCases.size > 1) {
    return res.status(400).json({ error: "Multiple anomalies detected. Reset your previous change and test one parameter at a time." });
  }

  // 3. Absolute block on standard business errors. An exploit NEVER overrides unrelated invalid states.
  if (businessErrors.length > 0) {
    return res.status(400).json({ error: businessErrors.join(" ") });
  }

  const finalSolvedCase = triggeredCases.size === 1 ? Array.from(triggeredCases)[0] : null;

  const responseData = {
    success: true,
    orderId,
    subtotal,
    shippingFee,
    discount: discountAmount,
    appliedCoupons,
    finalTotal: total,
    currency: currencyCode
  };

  if (finalSolvedCase) {
    responseData.solvedData = {
      caseId: finalSolvedCase,
      evidence: evidenceMap[finalSolvedCase],
      flag: FLAGS[finalSolvedCase]
    };
  }

  return res.status(200).json(responseData);
}