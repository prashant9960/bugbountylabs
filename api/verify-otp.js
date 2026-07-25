export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    // Network realism delay
    await new Promise(resolve => setTimeout(resolve, 400));
  
    const { otp } = req.body;
  
    // The true OTP is unknown to the user, forcing them to intercept the 403 response.
    if (otp === "827394") {
      return res.status(200).json({
        success: true,
        verified: true,
        role: "admin",
        // Highly realistic JWT structure
        session: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcxNjIzOTAyMiwiZXhwIjoxNzE2MzI1NDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        expires: "2026-07-26T12:00:00Z",
        redirect: "/admin/dashboard",
        message: "Login successful."
      });
    }
  
    return res.status(403).json({
      success: false,
      verified: false,
      role: "guest",
      session: null,
      expires: null,
      redirect: null,
      message: "Invalid OTP. Authentication failed."
    });
  }