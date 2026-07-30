export default async function handler(req, res) {
    // Add a 500ms network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  
    const authHeader = req.headers.authorization;
  
    // Real backend authentication check
    if (!authHeader || authHeader !== "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.AdminBypass...") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "401 UNAUTHORIZED: Valid session token required to access this resource."
      });
    }
  
    // If the attacker actually had the token, they'd get this:
    return res.status(200).json({
      users: 1834,
      revenue: "$42,500",
      apiKey: "sk_live_983274982374928374"
    });
  }