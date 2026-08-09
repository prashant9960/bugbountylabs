// backend/verify-otp.js

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    await new Promise(resolve => setTimeout(resolve, 400));

    // SAFE BODY PARSING: Prevents crashes if Vercel rewrites drop the auto-parser
    let body = req.body || {};
    if (typeof req.body === 'string') {
      try { body = JSON.parse(req.body); } catch (e) {}
    }

    const { email, otp } = body;

    if (!email || email !== "admin@vcorp.local") {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "Account not found or access restricted."
      });
    }

    // Stateless 2-minute attempt context to track the flow
    const attemptContext = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    if (otp === "827394") {
      return res.status(200).json({
        success: true,
        verified: true,
        session: attemptContext,
        message: "Login successful."
      });
    }

    return res.status(403).json({
      success: false,
      verified: false,
      session: attemptContext, 
      message: "Invalid OTP. Authentication failed."
    });

  } catch (error) {
    // If anything fails, return JSON instead of a 500 crash page
    console.error("Verify-OTP Crash:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}