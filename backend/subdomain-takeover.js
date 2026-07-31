// Clean timeline tracking
const TIMELINE = {
    DISCOVER: 1,
    INSPECT_DNS: 2,
    CLAIM: 3,
    VERIFY_OWNERSHIP: 4,
    SUCCESS: 5,
    EXPLAIN: 6,
    MISSING_VALIDATION: 7 // Used to represent the "Root Cause" realization
  };
  
  // Shared memory for serverless (resets on cold start)
  global.subdomainLabState = global.subdomainLabState || {
    timelineStep: TIMELINE.DISCOVER,
    discovered: false,
    dnsViewed: false,
    domainClaimed: false,
    
    // Grouped infrastructure data for future extensibility
    infrastructure: {
      provider: "GitHub Pages",
      dnsRecord: {
        type: "CNAME",
        target: "vertex.github.io"
      },
      hostingResourceExists: false, // Explicitly models the vulnerability
      ownershipVerified: false
    }
  };
  
  export default async function handleSubdomainTakeover(req, res) {
    const { action } = req.query;
  
    // 1. VERIFICATION ENDPOINT (Strictly read-only)
    if (action === 'verify') {
      if (global.subdomainLabState.infrastructure.ownershipVerified) {
        return res.status(200).json({ complete: true, flag: "FLAG{dangling_cname}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // 2. RESET ENDPOINT
    if (req.method === 'DELETE') {
      global.subdomainLabState = {
        timelineStep: TIMELINE.DISCOVER,
        discovered: false,
        dnsViewed: false,
        domainClaimed: false,
        infrastructure: {
          provider: "GitHub Pages",
          dnsRecord: { type: "CNAME", target: "vertex.github.io" },
          hostingResourceExists: false,
          ownershipVerified: false
        }
      };
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // 3. GET STATE
    if (req.method === 'GET') {
      return res.status(200).json(global.subdomainLabState);
    }
  
    // 4. BUSINESS LOGIC ENDPOINTS
    if (req.method === 'POST') {
      const { type } = req.body;
  
      if (type === 'VISIT_SUBDOMAIN') {
        global.subdomainLabState.discovered = true;
        global.subdomainLabState.timelineStep = TIMELINE.DISCOVER;
        return res.status(200).json({ success: true, state: global.subdomainLabState });
      }
  
      if (type === 'INSPECT_DNS') {
        global.subdomainLabState.dnsViewed = true;
        global.subdomainLabState.timelineStep = TIMELINE.INSPECT_DNS;
        return res.status(200).json({ success: true, state: global.subdomainLabState });
      }
  
      if (type === 'CLAIM_DOMAIN') {
        global.subdomainLabState.domainClaimed = true;
        global.subdomainLabState.timelineStep = TIMELINE.CLAIM;
        return res.status(200).json({ success: true, state: global.subdomainLabState });
      }
  
      if (type === 'VERIFY_OWNERSHIP') {
        // The attacker successfully bound the dangling DNS to their new project
        global.subdomainLabState.infrastructure.ownershipVerified = true;
        global.subdomainLabState.timelineStep = TIMELINE.VERIFY_OWNERSHIP;
        return res.status(200).json({ success: true, state: global.subdomainLabState });
      }
  
      if (type === 'WEBSITE_ACTIVE') {
        // The attacker's new hosting resource is now active
        global.subdomainLabState.infrastructure.hostingResourceExists = true; 
        global.subdomainLabState.timelineStep = TIMELINE.SUCCESS;
        return res.status(200).json({ success: true, state: global.subdomainLabState });
      }
  
      if (type === 'BEGIN_EXPLANATION') {
        global.subdomainLabState.timelineStep = TIMELINE.EXPLAIN;
        return res.status(200).json({ success: true, state: global.subdomainLabState });
      }
    }
  
    return res.status(400).json({ error: "Invalid action or method" });
  }