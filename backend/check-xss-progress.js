global.xssLabProgress = global.xssLabProgress || { escapedContext: false };

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (global.xssLabProgress.escapedContext) {
    return res.status(200).json({ complete: true, flag: "FLAG{xss_context_breakout}" });
  }
  
  return res.status(200).json({ complete: false });
}