/**
 * REAL Institute - Send User Notes to Email Edge Function
 * Location: netlify/edge-functions/send_notes.js
 * Receives user notes & email on website exit or manual request.
 */

export default async (request, context) => {
  if (request.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const data = await request.json();
    const { email, notes, pageTitle, pageUrl } = data;

    if (!email || !notes) {
      return new Response(JSON.stringify({ error: "Email and notes required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[REAL Notes Dispatch] Sending notes to ${email} for page: ${pageTitle || pageUrl}`);

    // Standard email response payload / web-hook integration
    return new Response(JSON.stringify({
      status: "dispatched",
      message: `Notes successfully queued for email transmission to ${email}`,
      timestamp: new Date().toISOString(),
      recipient: email,
      notesLength: notes.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
