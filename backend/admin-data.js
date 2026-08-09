// backend/admin-data.js

const FLAG_OTP_BYPASS = "VCorp5x9P2mK8qL4";

export default function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization || "";
    
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Missing bearer token." });
    }

    const token = authHeader.replace("Bearer ", "");
    
    try {
      const decodedSession = Buffer.from(token, 'base64').toString('utf8');
      const [email, timeStr] = decodedSession.split(':');
      
      const timestamp = parseInt(timeStr, 10);
      const now = Date.now();

      // Strict 2-minute expiration match and negative timestamp (future) prevention
      if (email !== "admin@vcorp.local" || isNaN(timestamp) || now < timestamp || now - timestamp > 2 * 60 * 1000) {
        return res.status(401).json({ error: "Unauthorized. Invalid or expired lab context." });
      }
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized. Malformed context." });
    }

    return res.status(200).json({
      users: 14205,
      revenue: "$84,302",
      activeSessions: 89,
      solvedData: {
        caseId: "OTP_BYPASS",
        flag: FLAG_OTP_BYPASS
      }
    });

  } catch (error) {
    console.error("Admin-Data Crash:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}