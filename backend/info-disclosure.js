// Clean, single-source-of-truth timeline tracking
const TIMELINE = {
    NORMAL_REQUEST: 1,
    REQUEST_MODIFIED: 2,
    VERBOSE_ERROR: 3,
    HIDDEN_CLUE: 4,
    FOLLOW_CLUE: 5,
    SENSITIVE_INFO: 6,
    EXPLAIN: 7
  };
  
  // Shared memory for serverless (resets on cold start)
  global.infoDisclosureLab = global.infoDisclosureLab || {
    timelineStep: TIMELINE.NORMAL_REQUEST
  };
  
  export default async function handleInfoDisclosure(req, res) {
    const { action } = req.query;
  
    // 1. VERIFICATION ENDPOINT (Strictly read-only, backend-enforced)
    // Forces the learner to at least reach the explanation phase before claiming the flag
    if (action === 'verify') {
      if (global.infoDisclosureLab.timelineStep >= TIMELINE.EXPLAIN) {
        return res.status(200).json({ complete: true, flag: "FLAG{information_disclosure_breadcrumb}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // 2. RESET ENDPOINT
    if (req.method === 'DELETE') {
      global.infoDisclosureLab = {
        timelineStep: TIMELINE.NORMAL_REQUEST
      };
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // 3. GET STATE
    if (req.method === 'GET') {
      return res.status(200).json(global.infoDisclosureLab);
    }
  
    // 4. BUSINESS LOGIC ENDPOINTS
    if (req.method === 'POST') {
      const { type, payload } = req.body;
  
      if (type === 'VISIT_INSPECTOR') {
        return res.status(200).json({ success: true, state: global.infoDisclosureLab });
      }
  
      // Explicit state update to make the timeline genuinely reflect the modification step
      if (type === 'MARK_MODIFIED') {
        global.infoDisclosureLab.timelineStep = TIMELINE.REQUEST_MODIFIED;
        return res.status(200).json({ success: true, state: global.infoDisclosureLab });
      }
  
      if (type === 'SUBMIT_PROFILE') {
        try {
          const parsedBody = JSON.parse(payload);
          
          // Simulation: The malformed payload causes an exception.
          // The vulnerability is NOT the exception itself.
          // The vulnerability is the VERBOSE RESPONSE revealing internal paths.
          if (Array.isArray(parsedBody)) {
            
            // Realistic server processing delay before crashing
            await new Promise(resolve => setTimeout(resolve, 400));
            
            global.infoDisclosureLab.timelineStep = TIMELINE.VERBOSE_ERROR;
            
            return res.status(500).json({ 
              error: true, 
              type: "VerboseError",
              message: "TypeError: profile.name.trim is not a function",
              state: global.infoDisclosureLab 
            });
          }
          
          // Normal valid request
          return res.status(200).json({ 
            success: true, 
            message: "Profile Updated", 
            state: global.infoDisclosureLab 
          });
  
        } catch (e) {
          return res.status(400).json({ error: true, type: "SyntaxError", message: "Invalid JSON format." });
        }
      }
  
      if (type === 'REVEAL_CLUE') {
        global.infoDisclosureLab.timelineStep = TIMELINE.HIDDEN_CLUE;
        return res.status(200).json({ success: true, state: global.infoDisclosureLab });
      }
  
      if (type === 'FOLLOW_BREADCRUMB') {
        global.infoDisclosureLab.timelineStep = TIMELINE.SENSITIVE_INFO;
        return res.status(200).json({ success: true, state: global.infoDisclosureLab });
      }
  
      if (type === 'BEGIN_EXPLANATION') {
        global.infoDisclosureLab.timelineStep = TIMELINE.EXPLAIN;
        return res.status(200).json({ success: true, state: global.infoDisclosureLab });
      }
    }
  
    return res.status(400).json({ error: "Invalid action or method" });
  }