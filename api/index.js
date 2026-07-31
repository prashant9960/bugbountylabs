// 1. Import all the unmodified files from your backend folder
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

export default async function handler(req, res) {
  // Extract the base URL without query parameters
  const urlPath = req.url.split('?')[0];

  // 2. Route the request to the exact file it belongs to
  switch (urlPath) {
    case '/api/v1/admin/dashboard': return adminDashboard(req, res);
    case '/api/admin-data': return adminData(req, res);
    case '/api/book-seat': return bookSeat(req, res);
    case '/api/cancel-order': return cancelOrder(req, res);
    case '/api/check-graphql-progress': return checkGraphqlProgress(req, res);
    case '/api/check-race-progress': return checkRaceProgress(req, res);
    case '/api/check-xss-progress': return checkXssProgress(req, res);
    case '/api/checkout': return checkout(req, res);
    case '/api/graphql': return graphql(req, res);
    case '/api/orders-lab': return ordersLab(req, res);
    case '/api/search-xss': return searchXss(req, res);
    case '/api/track-order': return trackOrder(req, res);
    case '/api/verify-otp': return verifyOtp(req, res);
  }

  // Handle dynamic routing for the IDOR lab (e.g., /api/orders/5001)
  if (urlPath.startsWith('/api/orders/')) {
    return ordersLab(req, res);
  }
  if (urlPath === '/api/pre-ato' || urlPath === '/api/check-pre-ato-progress') {
    return handlePreATO(req, res);
  }
  if (urlPath === '/api/captcha-fail-open' || urlPath === '/api/check-captcha-progress') {
    return handleCaptchaFailOpen(req, res);
  }
  // Fallback
  return res.status(404).json({ error: "API Endpoint not found." });
}