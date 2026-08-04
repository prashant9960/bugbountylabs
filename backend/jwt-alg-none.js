// Clean, single-source-of-truth timeline tracking
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
  
  // SIMULATED REDIS / DB SESSION STORE
  // In production, this maps to a real DB or Redis instance keyed by session cookie/token.
  const sessionStore = new Map();
  
  const getSession = (sessionId) => {
    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, {
        timelineStep: TIMELINE.LOGIN,
        scene: 'LOGIN',
        headerModified: false,
        signatureRemoved: false,
        predictionMade: null,
        accessGranted: false
      });
    }
    return sessionStore.get(sessionId);
  };
  
  export default async function handleJwtAlgNone(req, res) {
    const { action } = req.query;
    const sessionId = req.headers['x-session-id'];
  
    if (!sessionId) {
      return res.status(401).json({ error: "Missing Session ID" });
    }
  
    const session = getSession(sessionId);
  
    // 1. VERIFICATION ENDPOINT (Strictly read-only, backend-enforced)
    if (action === 'verify') {
      // Prevent skipping: Learner must have reached the explanation to verify
      if (session.timelineStep >= TIMELINE.EXPLAIN) {
        return res.status(200).json({ complete: true, flag: "FLAG{never_trust_client_algorithm}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // 2. RESET ENDPOINT
    if (req.method === 'DELETE') {
      sessionStore.set(sessionId, {
        timelineStep: TIMELINE.LOGIN,
        scene: 'LOGIN',
        headerModified: false,
        signatureRemoved: false,
        predictionMade: null,
        accessGranted: false
      });
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // 3. GET STATE
    if (req.method === 'GET') {
      return res.status(200).json(session);
    }
  
    // 4. BUSINESS LOGIC ENDPOINTS
    if (req.method === 'POST') {
      const { type, payload } = req.body;
  
      if (type === 'LOGIN') {
        session.timelineStep = TIMELINE.JWT_ISSUED;
        session.scene = 'INSPECT';
        return res.status(200).json({ success: true, state: session });
      }
  
      if (type === 'MARK_HEADER_MODIFIED') {
        session.headerModified = true;
        if (session.timelineStep < TIMELINE.HEADER_MODIFIED) {
          session.timelineStep = TIMELINE.HEADER_MODIFIED;
        }
        return res.status(200).json({ success: true, state: session });
      }
  
      if (type === 'MARK_SIG_REMOVED') {
        session.signatureRemoved = true;
        if (session.timelineStep < TIMELINE.SIG_REMOVED) {
          session.timelineStep = TIMELINE.SIG_REMOVED;
        }
        return res.status(200).json({ success: true, state: session });
      }
  
      if (type === 'MAKE_PREDICTION') {
        session.predictionMade = payload.prediction;
        session.timelineStep = TIMELINE.PREDICTION;
        session.scene = 'FORWARDING_UI';
        return res.status(200).json({ success: true, state: session });
      }
  
      if (type === 'FORWARD_REQUEST') {
        // Prevent skipping straight to forward without logging in
        if (session.timelineStep < TIMELINE.JWT_ISSUED) {
          return res.status(403).json({ error: true, message: "Invalid sequence." });
        }
  
        session.timelineStep = TIMELINE.FORWARDED;
        
        try {
          const { header, signature } = payload;
          const parsedHeader = JSON.parse(header);
  
          // ❌ INTENTIONALLY VULNERABLE: ALGORITHM CONFUSION
          if (parsedHeader.alg && parsedHeader.alg.toLowerCase() === 'none') {
            if (signature.trim() === '') {
              session.accessGranted = true;
              session.timelineStep = TIMELINE.ADMIN_ACCESS; 
              session.scene = 'DASHBOARD';
              
              return res.status(200).json({ 
                success: true, 
                status: "Admin Access Granted",
                state: session 
              });
            } else {
              return res.status(401).json({ 
                error: true, 
                message: "Server rejected token. Signature found but alg is none.",
                state: session 
              });
            }
          }
          
          // Guided Failure Message (Instead of generic "Invalid signature")
          return res.status(401).json({ 
            error: true, 
            message: "Server rejected this token. Think again. What does 'alg' tell the server?",
            state: session 
          });
  
        } catch (e) {
          return res.status(400).json({ 
            error: true, 
            message: "Request couldn't be parsed. Fix the JSON syntax first.", 
            state: session 
          });
        }
      }
  
      if (type === 'BEGIN_EXPLANATION') {
        // Prevent skipping straight to explanation
        if (!session.accessGranted) {
          return res.status(403).json({ error: true, message: "Solve the lab first." });
        }
        session.timelineStep = TIMELINE.EXPLAIN;
        session.scene = 'EXPLAIN';
        return res.status(200).json({ success: true, state: session });
      }
    }
  
    return res.status(400).json({ error: "Invalid action or method" });
  }