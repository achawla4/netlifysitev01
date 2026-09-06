export default async (request, context) => {
  const userAgent = request.headers.get("user-agent") || "";
  const uaLower = userAgent.toLowerCase();
  
  let isBot = false;
  
  if (!userAgent) {
    isBot = true;
  } else {
    // Comprehensive keywords indicating a crawler, bot, scraper, indexer, or search engine
    const botKeywords = [
      'admantx', 'agent', 'ahrefs', 'ai', 'ai21',
      'archiver', 'audit', 'axios', 'bot', 'claude',
      'cohere', 'colly', 'crawler', 'crawling', 'curl',
      'dotbot', 'doubleverify', 'exabot', 'extract', 'faraday',
      'fasthttp', 'fetch', 'gemini', 'go-http-client', 'gpt',
      'grapeshot', 'guzzle', 'httpclient', 'httpx', 'ia_archiver',
      'index', 'java', 'jurassic', 'libcurl', 'llama',
      'llm', 'mj12', 'model', 'node-fetch', 'okhttp',
      'parse', 'proximic', 'pycurl', 'python', 'requests',
      'rest-client', 'scan', 'scrap', 'scraper', 'scrapy',
      'search', 'semrush', 'spider', 'transcoder', 'typhoeus',
      'urllib', 'verify', 'wget', 'googlebot', 'bingbot'
    ];
    
    // Check if user-agent contains any of the bot keywords
    isBot = botKeywords.some(keyword => uaLower.includes(keyword));
    
    // Failsafe: check if it lacks standard human browser signatures
    if (!isBot) {
      const humanSignatures = ['mozilla/', 'chrome/', 'safari/', 'firefox/', 'opera/', 'edge/'];
      const hasHumanSig = humanSignatures.some(sig => uaLower.includes(sig));
      if (!hasHumanSig) {
        isBot = true;
      }
    }
  }
  
  if (isBot) {
    // If the request contains a TollBit validation token (forwarded by TollBit),
    // allow it to pass through to Netlify's origin to serve the file.
    const authHeader = request.headers.get("Authorization") || "";
    const tollbitHeader = request.headers.get("X-Tollbit-Token") || "";
    
    if (authHeader.startsWith("Bearer ") || tollbitHeader) {
      return; // Proceed to serve the PDF/asset
    }
    
    // Redirect unauthorized bot to your TollBit custom subdomain
    const url = new URL(request.url);
    const tollbitUrl = `https://tollbit.yogoreal.net${url.pathname}${url.search}`;
    
    return Response.redirect(tollbitUrl, 302);
  }
  
  // Allow all normal human visitors through
  return;
};
