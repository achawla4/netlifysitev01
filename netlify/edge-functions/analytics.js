import { getStore } from "https://esm.sh/@netlify/blobs";

const SECRET_KEY = Deno.env.get("ANALYTICS_SECRET_KEY") || "REAL_MONITOR_SECRET_KEY_2026";

export default async (request, context) => {
  const url = new URL(request.url);

  // 1. Secured Analytics API Endpoint for local Monitor dashboard
  if (url.pathname === "/api/admin-analytics") {
    const authHeader = request.headers.get("x-analytics-key") || url.searchParams.get("key");
    if (authHeader !== SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const store = getStore("site-analytics");
      const rawEvents = await store.get("events", { type: "json" }) || [];
      return new Response(JSON.stringify({
        success: true,
        count: rawEvents.length,
        events: rawEvents,
        lastUpdated: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, events: [] }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 2. Filter out static assets & media
  const pathname = url.pathname.toLowerCase();
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.mp4', '.webm', '.pdf', '.txt', '.xml', '.json'];
  if (staticExtensions.some(ext => pathname.endsWith(ext)) || pathname.startsWith('/assets/') || pathname.startsWith('/kriya_previews/')) {
    return context.next();
  }

  // 3. Bot & Crawler Detection & Blocking
  const userAgent = request.headers.get("user-agent") || "";
  const uaLower = userAgent.toLowerCase();

  // Block node-fetch scrapers/bots with 403 Forbidden
  if (uaLower.includes("node-fetch")) {
    return new Response("Forbidden: Access Denied", { status: 403 });
  }

  const botKeywords = [
    'bot', 'crawler', 'spider', 'slurp', 'search', 'semrush', 'ahrefs',
    'googlebot', 'bingbot', 'yandex', 'baidu', 'duckduck', 'exabot', 'facebot',
    'ia_archiver', 'curl', 'wget', 'python', 'axios', 'node-fetch', 'gemini', 'gpt', 'claude'
  ];
  const isBot = !userAgent || botKeywords.some(k => uaLower.includes(k));

  // 4. Record human visitor analytics with Privacy-Preserving Security Fingerprint
  if (!isBot) {
    const rawIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Create non-reversible salted hash for security tracking (brute-force / unique visitor detection)
    let clientHash = "anon";
    try {
      const msgBuffer = new TextEncoder().encode(rawIp + SECRET_KEY);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      clientHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 12);
    } catch (_) {}

    const event = {
      timestamp: new Date().toISOString(),
      path: url.pathname,
      country: context.geo?.country?.name || "Unknown",
      countryCode: context.geo?.country?.code || "XX",
      city: context.geo?.city || "Unknown",
      subdivision: context.geo?.subdivision?.name || "",
      referrer: request.headers.get("referer") || "Direct",
      device: uaLower.includes("mobile") ? "Mobile" : "Desktop",
      clientHash: clientHash
    };

    // Store asynchronously without delaying the user's page load
    context.waitUntil((async () => {
      try {
        const store = getStore("site-analytics");
        const existing = await store.get("events", { type: "json" }) || [];
        existing.push(event);
        // Keep the most recent 10,000 events
        if (existing.length > 10000) {
          existing.shift();
        }
        await store.setJSON("events", existing);
      } catch (err) {
        console.error("Error logging analytics event:", err);
      }
    })());
  }

  return context.next();
};
