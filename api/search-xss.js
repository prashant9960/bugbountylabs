global.xssLabProgress = global.xssLabProgress || { escapedContext: false };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  await new Promise(resolve => setTimeout(resolve, 300));

  const debugParam = req.query.debug || '';
  const queryParam = req.query.q || 'airpods';
  
  const exactPayload = '"><style>@keyframes x{}</style><b style="animation-name:x" onanimationstart="alert(1)"></b>';

  if (debugParam === exactPayload || debugParam.includes('onanimationstart="alert(1)"')) {
    global.xssLabProgress.escapedContext = true;
  }

  // INTENTIONALLY VULNERABLE: 
  // No HTML entity encoding on debugParam. 
  const rawHtml = `<!-- V-Corp Internal Diagnostics -->
<div class="debug-panel" style="display: none;">
  <input type="hidden" id="diagnostic-target" value="${debugParam}">
  <span class="status">System OK</span>
</div>`;

  const iframeHtml = `<!DOCTYPE html>
<html>
<head><title>Diagnostic Frame</title></head>
<body>
  ${rawHtml}
</body>
</html>`;

  return res.status(200).json({
    success: true,
    query: queryParam,
    htmlSource: rawHtml,
    iframeSource: iframeHtml
  });
}