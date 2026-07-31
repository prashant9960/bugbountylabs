// Clean timeline tracking (Backend dictates state, UI only renders it)
const TIMELINE = {
    REGISTER: 1,
    CAPTCHA_SOLVED: 2,
    REQUEST_CREATED: 3,
    PARAM_MISSING: 4,
    REQUEST_RECEIVED: 5,
    SUCCESS: 6,
    MISSING_VALIDATION: 7
  };
  
  // Shared memory for serverless (resets on cold start)
  global.captchaLabState = global.captchaLabState || {
    timelineStep: TIMELINE.REGISTER,
    captchaSolved: false,
    paramRemoved: false,
    registrationAccepted: false,
  };
  
  export default async function handleCaptchaFailOpen(req, res) {
    const { action } = req.query;
  
    // 1. VERIFICATION ENDPOINT (Strictly read-only)
    if (action === 'verify') {
      if (global.captchaLabState.registrationAccepted && global.captchaLabState.paramRemoved) {
        return res.status(200).json({ complete: true, flag: "FLAG{missing_server_validation}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // 2. RESET ENDPOINT
    if (req.method === 'DELETE') {
      global.captchaLabState = {
        timelineStep: TIMELINE.REGISTER,
        captchaSolved: false,
        paramRemoved: false,
        registrationAccepted: false,
      };
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // 3. GET STATE
    if (req.method === 'GET') {
      return res.status(200).json(global.captchaLabState);
    }
  
    // 4. BUSINESS LOGIC ENDPOINTS
    if (req.method === 'POST') {
      const { type, payload } = req.body;
  
      if (type === 'SOLVE_CAPTCHA') {
        global.captchaLabState.captchaSolved = true;
        global.captchaLabState.timelineStep = TIMELINE.CAPTCHA_SOLVED;
        return res.status(200).json({ success: true, state: global.captchaLabState });
      }
  
      if (type === 'CAPTURE_REQUEST') {
        global.captchaLabState.timelineStep = TIMELINE.REQUEST_CREATED;
        return res.status(200).json({ success: true, state: global.captchaLabState });
      }
  
      if (type === 'REMOVE_CAPTCHA_TOKEN') {
        global.captchaLabState.paramRemoved = true;
        global.captchaLabState.timelineStep = TIMELINE.PARAM_MISSING;
        return res.status(200).json({ success: true, state: global.captchaLabState });
      }
  
      if (type === 'SUBMIT_REQUEST') {
        global.captchaLabState.timelineStep = TIMELINE.REQUEST_RECEIVED;
        
        // ❌ INTENTIONALLY VULNERABLE: FAIL-OPEN LOGIC
        // Distinct branches accurately model how this bug appears in real backends.
        if (payload.captchaToken) {
          // Expected Path: Conceptually validate the token if it was provided.
          // NOTE: In a real app, this would involve a cryptographic check or external API call.
          // Here, we use a simple length check to mock the validation for educational purposes.
          const isValid = payload.captchaToken.length > 10;
          if (isValid) {
            global.captchaLabState.registrationAccepted = true;
          }
        } else {
          // Vulnerable Path: Token is entirely missing. Validation is skipped, 
          // but the code fails open and allows registration to proceed anyway.
          global.captchaLabState.registrationAccepted = true;
        }
  
        global.captchaLabState.timelineStep = TIMELINE.SUCCESS;
        
        return res.status(200).json({ 
          success: true, 
          status: "Account Created", 
          accountId: "USR-28491",
          state: global.captchaLabState 
        });
      }
  
      // Explicitly advance the timeline to the final educational step
      if (type === 'BEGIN_EXPLANATION') {
        global.captchaLabState.timelineStep = TIMELINE.MISSING_VALIDATION;
        return res.status(200).json({ success: true, state: global.captchaLabState });
      }
    }
  
    return res.status(400).json({ error: "Invalid action or method" });
  }