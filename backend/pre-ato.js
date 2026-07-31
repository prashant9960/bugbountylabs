// Shared memory for serverless (resets on cold start)
global.preAtoState = global.preAtoState || {
    accountExists: false,
    password: "",
    verified: false,
    merged: false,
    attackerHasAccess: false,
    timelineStep: 0,
  };
  
  export default async function handlePreATO(req, res) {
    const { action } = req.query;
  
    // 1. VERIFICATION ENDPOINT
    if (action === 'verify') {
      if (global.preAtoState.attackerHasAccess) {
        return res.status(200).json({ complete: true, flag: "FLAG{pre_account_takeover}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // 2. RESET ENDPOINT
    if (req.method === 'DELETE') {
      global.preAtoState = {
        accountExists: false,
        password: "",
        verified: false,
        merged: false,
        attackerHasAccess: false,
        timelineStep: 0,
      };
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // 3. GET STATE
    if (req.method === 'GET') {
      return res.status(200).json(global.preAtoState);
    }
  
    // 4. BUSINESS LOGIC ENDPOINTS
    if (req.method === 'POST') {
      const { type, email, password } = req.body;
  
      // SCENE 1: Attacker registers an unverified account
      if (type === 'REGISTER') {
        global.preAtoState.accountExists = true;
        global.preAtoState.password = password;
        global.preAtoState.verified = false;
        global.preAtoState.timelineStep = 1;
        return res.status(200).json({ success: true, state: global.preAtoState });
      }
  
      // SCENE 2: Victim logs in with Google (The Vulnerability)
      if (type === 'GOOGLE_LOGIN') {
        if (global.preAtoState.accountExists) {
          // INTENTIONALLY VULNERABLE: PRE-ACCOUNT TAKEOVER
          // The developer trusts the email from Google and merges it with the 
          // existing unverified account, without resetting the password or validating identity.
          global.preAtoState.merged = true;
          global.preAtoState.verified = true;
          global.preAtoState.timelineStep = 3;
        }
        return res.status(200).json({ success: true, state: global.preAtoState });
      }
  
      // SCENE 3: Attacker logs back in using the original password
      if (type === 'PASSWORD_LOGIN') {
        if (global.preAtoState.accountExists && global.preAtoState.password === password) {
          if (global.preAtoState.merged) {
            global.preAtoState.attackerHasAccess = true;
            global.preAtoState.timelineStep = 5;
          }
          return res.status(200).json({ success: true, state: global.preAtoState });
        }
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    }
  
    return res.status(400).json({ error: "Invalid action or method" });
  }