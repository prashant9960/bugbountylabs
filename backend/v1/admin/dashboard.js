export default async function handler(req, res) {
    // 600ms delay gives the UI just enough time to render the fake dashboard before crashing it
    await new Promise(resolve => setTimeout(resolve, 600));
  
    const authHeader = req.headers.authorization;
    const validToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcxNjIzOTAyMiwiZXhwIjoxNzE2MzI1NDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  
    // The backend strictly enforces the session token
    if (!authHeader || authHeader !== validToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "401 UNAUTHORIZED: Valid session token required."
      });
    }
  
    return res.status(200).json({
      users: 1834,
      revenue: "$42,500",
      apiKey: "sk_live_983274982374928374"
    });
  }