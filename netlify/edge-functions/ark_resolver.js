import metadata from "../../assets/papers_metadata.json" assert { type: "json" };

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Regex to extract the paper number from /ark:/37285/p[number]
  const match = path.match(/^\/ark:\/37285\/p(\d+)/i);
  if (!match) {
    return; // Pass through to normal routing
  }
  
  const paperId = match[1];
  
  const paperData = metadata[paperId];
  if (!paperData && path.toLowerCase().startsWith("/ark:/37285/p")) {
    // If it looks like a paper request but doesn't exist
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Paper Not Found - REAL Institute</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; color: #333; }
          .card { max-width: 500px; margin: auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h1 { color: #e74c3c; margin-bottom: 20px; }
          a { color: #3498db; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Paper Not Found</h1>
          <p>The publication with identifier <strong>ark:/37285/p${paperId}</strong> could not be found.</p>
          <p style="margin-top: 30px;"><a href="/toc.html">← Back to Table of Contents</a></p>
        </div>
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  
  // Determine inflection type
  const rawUrl = request.url;
  const isDoubleInflection = rawUrl.endsWith("??") || url.search.startsWith("??");
  const isSingleInflection = !isDoubleInflection && (rawUrl.endsWith("?") || url.search === "" && rawUrl.includes("?"));
  
  const acceptHeader = request.headers.get("accept") || "";
  const wantsJson = acceptHeader.includes("application/json") || url.searchParams.get("format") === "json";
  const wantsText = acceptHeader.includes("text/plain") || url.searchParams.get("format") === "text";
  
  // 1. Double Inflection (??) - Return Persistence Statement
  if (isDoubleInflection) {
    const policyData = {
      assigner: "REAL Institute (Hariharananda REAL Institute)",
      naan: "37285",
      policy: {
        identifier_permanence: "All ARK identifiers assigned by the REAL Institute are permanent. Once assigned, an identifier will never be re-used, reassigned, or deleted.",
        object_permanence: "The REAL Institute is committed to the long-term preservation, digital accessibility, and integrity of its research papers. If hosting endpoints change, redirects will be maintained.",
        metadata_policy: "Metadata for each publication is stored in open formats, updated for accuracy, and freely accessible without authentication."
      }
    };
    
    if (wantsJson) {
      return new Response(JSON.stringify(policyData, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    
    if (wantsText) {
      return new Response(
        `REAL Institute ARK Persistence Policy\n` +
        `=====================================\n` +
        `Assigning Authority: ${policyData.assigner}\n` +
        `NAAN: ${policyData.naan}\n\n` +
        `1. Identifier Permanence:\n${policyData.policy.identifier_permanence}\n\n` +
        `2. Object Permanence:\n${policyData.policy.object_permanence}\n\n` +
        `3. Metadata Policy:\n${policyData.policy.metadata_policy}\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    
    // Return gorgeous HTML Policy Page
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ARK Persistence Policy - REAL Institute</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --panel-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #38bdf8;
            --accent-glow: rgba(56, 189, 248, 0.15);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-gradient);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 650px;
            width: 100%;
            background: var(--panel-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 20px;
          }
          .header h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 8px;
          }
          .naan-badge {
            display: inline-block;
            background: var(--accent-glow);
            color: var(--accent);
            border: 1px solid var(--accent);
            font-family: monospace;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section p {
            color: var(--text-secondary);
            font-size: 0.95rem;
            text-align: justify;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
          .footer a {
            color: var(--accent);
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ARK Persistence Policy</h1>
            <div class="naan-badge">NAAN: ${policyData.naan}</div>
          </div>
          
          <div class="section">
            <h2>1. Identifier Permanence</h2>
            <p>${policyData.policy.identifier_permanence}</p>
          </div>
          
          <div class="section">
            <h2>2. Object Permanence</h2>
            <p>${policyData.policy.object_permanence}</p>
          </div>
          
          <div class="section">
            <h2>3. Metadata Policy</h2>
            <p>${policyData.policy.metadata_policy}</p>
          </div>
          
          <div class="footer">
            <p>Administered by <a href="/">Hariharananda REAL Institute</a></p>
          </div>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  
  // 2. Single Inflection (?) - Return Object Metadata (ERC Profile)
  if (isSingleInflection) {
    const ercData = {
      who: paperData.authors,
      what: paperData.title,
      when: paperData.year,
      where: paperData.url
    };
    
    if (wantsJson) {
      return new Response(JSON.stringify(ercData, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    
    if (wantsText) {
      return new Response(
        `erc:\n` +
        `who: ${ercData.who}\n` +
        `what: ${ercData.what}\n` +
        `when: ${ercData.when}\n` +
        `where: ${ercData.where}\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    
    // Return gorgeous HTML Metadata Citation Card
    const bibtex = `@article{real_${paperId},\n` +
      `  author = {${paperData.authors}},\n` +
      `  title = {${paperData.title}},\n` +
      `  year = {${paperData.year}},\n` +
      `  publisher = {REAL Institute},\n` +
      `  url = {${paperData.url}},\n` +
      `  note = {ARK: ark:/37285/p${paperId}}\n` +
      `}`;
      
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Metadata - ${paperData.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --panel-bg: rgba(30, 41, 59, 0.75);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #38bdf8;
            --accent-glow: rgba(56, 189, 248, 0.15);
            --card-inner-bg: rgba(15, 23, 42, 0.6);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-gradient);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 700px;
            width: 100%;
            background: var(--panel-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          }
          .header {
            margin-bottom: 25px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 15px;
          }
          .header h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.3;
          }
          .header .subtitle {
            font-size: 0.9rem;
            color: var(--accent);
            margin-top: 6px;
            font-family: monospace;
            font-weight: 600;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 12px 20px;
            background: var(--card-inner-bg);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .label {
            font-weight: 600;
            color: var(--accent);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .value {
            color: var(--text-primary);
            font-size: 0.95rem;
          }
          .value a {
            color: var(--accent);
            text-decoration: none;
          }
          .value a:hover {
            text-decoration: underline;
          }
          .citation-header {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
          }
          pre {
            background: #090d16;
            color: #a7f3d0;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.85rem;
            overflow-x: auto;
            border: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 25px;
          }
          .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #38bdf8;
            color: #0f172a;
            border: none;
            padding: 10px 18px;
            font-size: 0.9rem;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
          }
          .btn:hover {
            background: #7dd3fc;
            transform: translateY(-1px);
          }
          .btn-secondary {
            background: transparent;
            color: var(--text-primary);
            border: 1px solid var(--border-color);
          }
          .btn-secondary:hover {
            background: rgba(255,255,255,0.05);
            color: var(--text-primary);
          }
          .footer {
            text-align: center;
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
            font-size: 0.8rem;
            color: var(--text-secondary);
          }
          .footer a {
            color: var(--accent);
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${paperData.title}</h1>
            <div class="subtitle">ARK: ark:/37285/p${paperId}</div>
          </div>
          
          <div class="meta-grid">
            <div class="label">Who</div>
            <div class="value">${paperData.authors}</div>
            
            <div class="label">What</div>
            <div class="value">${paperData.title}</div>
            
            <div class="label">When</div>
            <div class="value">${paperData.year}</div>
            
            <div class="label">Where</div>
            <div class="value"><a href="${paperData.url}">${paperData.url}</a></div>
          </div>
          
          <div class="citation-header">BibTeX Citation</div>
          <pre id="bibtex">${bibtex}</pre>
          
          <div class="actions">
            <a href="/paper${paperId}.html" class="btn">View Publication Page</a>
            <button class="btn btn-secondary" onclick="copyBibtex()">Copy BibTeX</button>
            <a href="/ark:/37285/p${paperId}??" class="btn btn-secondary">Persistence Statement (??)</a>
          </div>
          
          <div class="footer">
            <p>Administered by the <a href="/">Hariharananda REAL Institute</a> (NAAN 37285)</p>
          </div>
        </div>
        
        <script>
          function copyBibtex() {
            const code = document.getElementById('bibtex').textContent;
            navigator.clipboard.writeText(code).then(() => {
              const btn = event.target;
              btn.textContent = 'Copied!';
              setTimeout(() => { btn.textContent = 'Copy BibTeX'; }, 1800);
            });
          }
        </script>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  
  // 3. Normal Request (no inflections) - Redirect to the actual publication HTML page
  return Response.redirect(new URL(`/paper${paperId}.html`, request.url), 301);
};
