// ── Config ────────────────────────────────────────────────────────────────
const OWNER  = process.env.GITHUB_OWNER;
const REPO   = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_TOKEN  || "";
const DIR    = process.env.GITHUB_DIR    || "";

// ── Browser detection ─────────────────────────────────────────────────────
function isBrowser(req) {
  if ((req.headers["sec-fetch-mode"] || "") === "navigate") return true;
  if ((req.headers["accept"] || "").includes("text/html")) return true;
  if (/\b(Chrome|Firefox|Safari|Edg|OPR|Opera|MSIE|Trident)\b/i.test(req.headers["user-agent"] || "")) return true;
  return false;
}

// ── Security headers ──────────────────────────────────────────────────────
function setHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
}

// ── Banned page ───────────────────────────────────────────────────────────
const BANNED_PAGE = `<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied - Banned</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        :root { --rainbow-gradient: linear-gradient(to right,#fff,#fff,#fff,#fff,#fff,#fff,#fff); }
        body,html { margin:0;padding:0;width:100%;height:100%;background:#000;color:#fff;font-family:'Inter',-apple-system,sans-serif;overflow:hidden;display:flex;align-items:center;justify-content:center; }
        .banned-container { text-align:center;padding:40px;max-width:500px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(255,255,255,.02);backdrop-filter:blur(10px); }
        .icon-box { font-size:80px;margin-bottom:20px;background:var(--rainbow-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;animation:rainbow 5s linear infinite; }
        h1 { font-size:32px;font-weight:800;margin-bottom:15px;background:var(--rainbow-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:rainbow 5s linear infinite; }
        p { font-size:16px;color:#a0a0a0;line-height:1.6;margin-bottom:30px; }
        .status-badge { display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(255,0,0,.1);border:1px solid rgba(255,0,0,.3);border-radius:999px;color:#ff5b5b;font-size:14px;font-weight:600; }
        .footer-info { margin-top:40px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#444; }
        @keyframes rainbow { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
        @media(max-width:600px){ .banned-container{margin:20px;padding:30px 20px} h1{font-size:24px} .icon-box{font-size:60px} }
    </style>
</head>
<body>
    <div class="banned-container">
        <div class="icon-box"><i class="fa-solid fa-shield-slash"></i></div>
        <h1>ACCESS BANNED</h1>
        <p>Your access to this content has been denied.<br>This endpoint is intended exclusively for script executors and cannot be accessed through standard web browsers.</p>
        <div class="status-badge"><i class="fa-solid fa-ban"></i><span>CONNECTION BLOCKED</span></div>
        <div class="footer-info"><i class="fa-solid fa-code"></i> &nbsp; SYSTEM_ID: BANNED_UA_DETECTED</div>
    </div>
</body>
</html>`;

// ── GitHub fetch ──────────────────────────────────────────────────────────
async function fetchLua(filename) {
  const path = DIR ? `${DIR}/${filename}` : filename;
  const url  = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(BRANCH)}`;

  async function attempt(withToken) {
    const headers = { Accept: "application/vnd.github.v3.raw", "User-Agent": "zeox-delivery/1.0" };
    if (withToken && TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
    let res;
    try { res = await fetch(url, { headers }); }
    catch (e) { throw new Error("GitHub unreachable"); }
    return res;
  }

  let res = await attempt(true);

  // Token invalid or expired — retry without it (works for public repos)
  if (res.status === 401) res = await attempt(false);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
  return res.text();
}

// ── Handler ───────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setHeaders(res);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end("Method Not Allowed");
  }

  const filename = req.query.filename || "";
  if (!/^[a-zA-Z0-9_-]+\.lua$/.test(filename)) return res.status(404).end("Not Found");

  if (isBrowser(req)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(403).send(BANNED_PAGE);
  }

  let content;
  try { content = await fetchLua(filename); }
  catch (e) { return res.status(500).end("Internal Server Error"); }

  if (content === null) return res.status(404).end("Not Found");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(content, "utf8"));
  return res.status(200).send(content);
};
