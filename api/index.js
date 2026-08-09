// api/index.js

// Import backend handlers
import adminDashboard from '../backend/v1/admin/dashboard.js';
import adminData from '../backend/admin-data.js';
import bookSeat from '../backend/book-seat.js';
import cancelOrder from '../backend/cancel-order.js';
import checkGraphqlProgress from '../backend/check-graphql-progress.js';
import checkRaceProgress from '../backend/check-race-progress.js';
import checkXssProgress from '../backend/check-xss-progress.js';
import checkout from '../backend/checkout.js';
import graphql from '../backend/graphql.js';
import ordersLab from '../backend/orders-lab.js';
import searchXss from '../backend/search-xss.js';
import trackOrder from '../backend/track-order.js';
import verifyOtp from '../backend/verify-otp.js';

import handlePreATO from '../backend/pre-ato.js';
import handleCaptchaFailOpen from '../backend/captcha-fail-open.js';
import handleSubdomainTakeover from '../backend/subdomain-takeover.js';
import handleInfoDisclosure from '../backend/info-disclosure.js';
import handleJwtAlgNone from '../backend/jwt-alg-none.js';

export default async function handler(req, res) {
  // Remove query parameters from the request path
  const urlPath = req.url.split('?')[0];

  // ============================================================
  // STATIC API ROUTES
  // ============================================================
  switch (urlPath) {

    // ----------------------------
    // Admin / OTP Lab
    // ----------------------------
    case '/api/v1/admin/dashboard':
      return adminDashboard(req, res);

    case '/api/v1/admin-data':
      return adminData(req, res);

    case '/api/v1/verify-otp':
      return verifyOtp(req, res);

    // Backward-compatible routes
    case '/api/admin-data':
      return adminData(req, res);

    case '/api/verify-otp':
      return verifyOtp(req, res);

    // ----------------------------
    // Price Manipulation
    // ----------------------------
    case '/api/checkout':
      return checkout(req, res);

    // ----------------------------
    // Seat / Race Condition
    // ----------------------------
    case '/api/book-seat':
      return bookSeat(req, res);

    case '/api/cancel-order':
      return cancelOrder(req, res);

    case '/api/check-race-progress':
      return checkRaceProgress(req, res);

    // ----------------------------
    // GraphQL
    // ----------------------------
    case '/api/graphql':
      return graphql(req, res);

    case '/api/check-graphql-progress':
      return checkGraphqlProgress(req, res);

    // ----------------------------
    // XSS
    // ----------------------------
    case '/api/search-xss':
      return searchXss(req, res);

    case '/api/check-xss-progress':
      return checkXssProgress(req, res);

    // ----------------------------
    // IDOR / Orders
    // ----------------------------
    case '/api/orders-lab':
      return ordersLab(req, res);

    case '/api/track-order':
      return trackOrder(req, res);

    // ----------------------------
    // Other Labs
    // ----------------------------
    case '/api/pre-ato':
    case '/api/check-pre-ato-progress':
      return handlePreATO(req, res);

    case '/api/captcha-fail-open':
    case '/api/check-captcha-progress':
      return handleCaptchaFailOpen(req, res);

    case '/api/subdomain-takeover':
    case '/api/check-subdomain-progress':
      return handleSubdomainTakeover(req, res);

    case '/api/info-disclosure':
      return handleInfoDisclosure(req, res);

    case '/api/jwt-alg-none':
      return handleJwtAlgNone(req, res);
  }

  // ============================================================
  // DYNAMIC IDOR ROUTING
  // Example:
  // /api/orders/5001
  // ============================================================
  if (urlPath.startsWith('/api/orders/')) {
    return ordersLab(req, res);
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return res.status(404).json({
    error: 'API Endpoint not found.'
  });
}