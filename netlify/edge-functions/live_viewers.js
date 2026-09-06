/**
 * REAL Institute - Netlify Edge Function: Real-Time Active Viewer Counter
 * Location: netlify/edge-functions/live_viewers.js
 * Endpoint: /api/live-viewers
 * Tracks real-time active visitor presence per page path via Netlify Blobs & Deno Edge runtime.
 */

import { getStore } from "https://esm.sh/@netlify/blobs";

// In-memory presence store per Deno Edge isolate for high-performance low-latency response
const memoryPresenceStore = new Map();
// Active session timeout: 45 seconds
const ACTIVE_TIMEOUT_MS = 45000;

export default async (request, context) => {
  // CORS Preflight Handler
  if (request.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-ID",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  const url = new URL(request.url);
  const now = Date.now();
  
  // Clean target path parameter
  let targetPath = url.searchParams.get("path") || "/";
  targetPath = targetPath.toLowerCase().split('?')[0].split('#')[0] || "/";
  if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;
  if (targetPath.length > 1 && targetPath.endsWith('/')) targetPath = targetPath.slice(0, -1);

  // Retrieve client session ID (persist session tab identity)
  const sessionId = request.headers.get("x-session-id") || url.searchParams.get("sessionId") || "anon_" + Math.random().toString(36).substring(2, 10);
  const isPing = request.method === "POST" || url.searchParams.get("ping") === "true";

  let blobStore = null;
  try {
    blobStore = getStore("real-active-presence");
  } catch (_) {
    // Graceful fallback if Netlify Blob store is unconfigured locally
  }

  // Load active sessions from Netlify Blob Store if available
  let presenceData = {};
  if (blobStore) {
    try {
      presenceData = (await blobStore.get("presence", { type: "json" })) || {};
    } catch (_) {
      presenceData = {};
    }
  }

  // Merge in-memory Deno isolate cache
  for (const [key, val] of memoryPresenceStore.entries()) {
    if (!presenceData[key] || val.lastSeen > (presenceData[key].lastSeen || 0)) {
      presenceData[key] = val;
    }
  }

  // Update heartbeat record for requesting active session
  const sessionKey = `${targetPath}::${sessionId}`;
  const currentRecord = {
    path: targetPath,
    sessionId: sessionId,
    lastSeen: now,
    country: context.geo?.country?.code || "XX",
    city: context.geo?.city || "Unknown"
  };
  
  presenceData[sessionKey] = currentRecord;
  memoryPresenceStore.set(sessionKey, currentRecord);

  // Filter out expired sessions (> 45s inactive) and calculate live metrics
  let activePageCount = 0;
  let globalActiveCount = 0;
  const cleanedPresence = {};

  for (const [key, record] of Object.entries(presenceData)) {
    if (record && record.lastSeen && (now - record.lastSeen <= ACTIVE_TIMEOUT_MS)) {
      cleanedPresence[key] = record;
      globalActiveCount++;
      
      if (record.path === targetPath) {
        activePageCount++;
      }
    } else {
      memoryPresenceStore.delete(key);
    }
  }

  // Asynchronously persist clean presence map back to Netlify Blobs
  if (blobStore && (isPing || Math.random() < 0.25)) {
    context.waitUntil((async () => {
      try {
        await blobStore.setJSON("presence", cleanedPresence);
      } catch (err) {
        console.error("[Live Viewers Blob Error]", err);
      }
    })());
  }

  const activeCount = Math.max(1, activePageCount);
  const totalGlobal = Math.max(activeCount, globalActiveCount);

  return new Response(JSON.stringify({
    success: true,
    path: targetPath,
    viewers: activeCount,
    globalViewers: totalGlobal,
    timestamp: now,
    source: "Netlify Edge Function"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
};
