// Clean timeline tracking
const TIMELINE = {
    LOGIN: 1,
    JWT_ISSUED: 2,
    HEADER_MODIFIED: 3,
    SIG_REMOVED: 4,
    PREDICTION: 5,
    FORWARDED: 6,
    VERIFICATION_SKIPPED: 7,
    ADMIN_ACCESS: 8,
    EXPLAIN: 9
  };
  
  // Shared memory for serverless (resets on cold start)
  global.jwtAlgNoneLab = global.jwtAlgNoneLab || {
    timelineStep: TIMELINE.LOGIN,
    headerModified: false,
    signatureRemoved: false,
    predictionMade: null,
    accessGranted: false
  };
  
  export default async function handleJwtAlgNone(req, res) {
    const { action } = req.query;
  
    // 1. VERIFICATION ENDPOINT (Strictly read-only)
    if (action === 'verify') {
      if (global.jwtAlgNoneLab.timelineStep >= TIMELINE.EXPLAIN) {
        return res.status(200).json({ complete: true, flag: "FLAG{never_trust_client_algorithm}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // 2. RESET ENDPOINT
    if (req.method === 'DELETE') {
      global.jwtAlgNoneLab = {
        timelineStep: TIMELINE.LOGIN,
        headerModified: false,
        signatureRemoved: false,
        predictionMade: null,
        accessGranted: false
      };
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // 3. GET STATE
    if (req.method === 'GET') {
      return res.status(200).json(global.jwtAlgNoneLab);
    }
  
    // 4. BUSINESS LOGIC ENDPOINTS
    if (req.method === 'POST') {
      const { type, payload } = req.body;
  
      if (type === 'LOGIN') {
        global.jwtAlgNoneLab.timelineStep = TIMELINE.JWT_ISSUED;
        return res.status(200).json({ success: true, state: global.jwtAlgNoneLab });
      }
  
      // Real-time timeline updates as the user edits the token
      if (type === 'MARK_HEADER_MODIFIED') {
        global.jwtAlgNoneLab.headerModified = true;
        if (global.jwtAlgNoneLab.timelineStep < TIMELINE.HEADER_MODIFIED) {
          global.jwtAlgNoneLab.timelineStep = TIMELINE.HEADER_MODIFIED;
        }
        return res.status(200).json({ success: true, state: global.jwtAlgNoneLab });
      }
  
      if (type === 'MARK_SIG_REMOVED') {
        global.jwtAlgNoneLab.signatureRemoved = true;
        if (global.jwtAlgNoneLab.timelineStep < TIMELINE.SIG_REMOVED) {
          global.jwtAlgNoneLab.timelineStep = TIMELINE.SIG_REMOVED;
        }
        return res.status(200).json({ success: true, state: global.jwtAlgNoneLab });
      }
  
      if (type === 'MAKE_PREDICTION') {
        global.jwtAlgNoneLab.predictionMade = payload.prediction;
        global.jwtAlgNoneLab.timelineStep = TIMELINE.PREDICTION;
        return res.status(200).json({ success: true, state: global.jwtAlgNoneLab });
      }
  
      if (type === 'FORWARD_REQUEST') {
        global.jwtAlgNoneLab.timelineStep = TIMELINE.FORWARDED;
        
        try {
          const { header, signature } = payload;
          const parsedHeader = JSON.parse(header);
  
          // ❌ INTENTIONALLY VULNERABLE: ALGORITHM CONFUSION
          // The server trusts the client's 'alg' header.
          // It does NOT check the payload. Payload manipulation is irrelevant here.
          if (parsedHeader.alg && parsedHeader.alg.toLowerCase() === 'none') {
            if (signature.trim() === '') {
              // Verification Skipped!
              global.jwtAlgNoneLab.accessGranted = true;
              global.jwtAlgNoneLab.timelineStep = TIMELINE.VERIFICATION_SKIPPED;
              
              // Advance to Admin Access after a micro-delay in UI, but set state now
              return res.status(200).json({ 
                success: true, 
                status: "Verification Skipped",
                state: global.jwtAlgNoneLab 
              });
            } else {
              // They changed to 'none' but left the signature intact.
              return res.status(401).json({ 
                error: true, 
                message: "Invalid signature format for alg:none",
                state: global.jwtAlgNoneLab 
              });
            }
          }
          
          // Expected secure behavior if they didn't change the algorithm
          return res.status(401).json({ 
            error: true, 
            message: "Signature verification failed. Invalid signature.",
            state: global.jwtAlgNoneLab 
          });
  
        } catch (e) {
          return res.status(400).json({ error: true, message: "Malformed Header JSON", state: global.jwtAlgNoneLab });
        }
      }
  
      if (type === 'GRANT_ADMIN') {
        global.jwtAlgNoneLab.timelineStep = TIMELINE.ADMIN_ACCESS;
        return res.status(200).json({ success: true, state: global.jwtAlgNoneLab });
      }
  
      if (type === 'BEGIN_EXPLANATION') {
        global.jwtAlgNoneLab.timelineStep = TIMELINE.EXPLAIN;
        return res.status(200).json({ success: true, state: global.jwtAlgNoneLab });
      }
    }
  
    return res.status(400).json({ error: "Invalid action or method" });
  }