// backend/v1/verify-otp.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await new Promise(resolve => setTimeout(resolve, 400));

  const { email, otp } = req.body;

  if (!email || email !== "admin@vcorp.local") {
    return res.status(403).json({
      success: false,
      verified: false,
      message: "Account not found or access restricted."
    });
  }

  // LAB FLOW IDENTIFIER (Not a secure auth token)
  // This is a stateless 2-minute context used to bridge the UI transition.
  const labFlowContext = Buffer.from(`${email}:${Date.now()}`).toString('base64');

  // Hardcoded sandbox OTP
  if (otp === "827394") {
    return res.status(200).json({
      success: true,
      verified: true,
      session: labFlowContext,
      message: "Login successful."
    });
  }

  return res.status(403).json({
    success: false,
    verified: false,
    session: labFlowContext, 
    message: "Invalid OTP. Authentication failed."
  });
}