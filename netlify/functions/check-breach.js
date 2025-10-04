const fetch = require("node-fetch");

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;

const ipRequests = new Map();
const cache = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const arr = ipRequests.get(ip) || [];
  const recent = arr.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    ipRequests.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipRequests.set(ip, recent);
  return false;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const API_KEY = process.env.HIBP_API_KEY;
  const CAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
  if (!API_KEY || !CAPTCHA_SECRET) {
    return { statusCode: 500, body: "Server misconfiguration" };
  }

  const ip = (event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown").split(",")[0].trim();
  if (isRateLimited(ip)) return { statusCode: 429, body: "Rate limit exceeded" };

  let email, token;
  try {
    const body = JSON.parse(event.body);
    email = (body.email || "").trim().toLowerCase();
    token = body.token;
  } catch {
    return { statusCode: 400, body: "Invalid request body" };
  }

  if (!email || !email.includes("@") || !token) {
    return { statusCode: 400, body: "Missing or invalid email/token" };
  }

  // Verify CAPTCHA
  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${CAPTCHA_SECRET}&response=${token}`
  });

  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return { statusCode: 403, body: "CAPTCHA verification failed" };
  }

  const cacheKey = `breach:${email}`;
  const now = Date.now();
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (entry.expires > now) return { statusCode: 200, body: JSON.stringify(entry.data) };
    cache.delete(cacheKey);
  }

  const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "hibp-api-key": API_KEY,
        "user-agent": "jenkinson-tech-talks/1.0"
      }
    });

    if (res.status === 404) {
      const data = { breached: false };
      cache.set(cacheKey, { expires: now + CACHE_TTL_MS, data });
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (res.status === 200) {
      const body = await res.json();
      const data = {
        breached: true,
        count: Array.isArray(body) ? body.length : 1,
        breaches: Array.isArray(body) ? body.map(b => ({ name: b.Name, domain: b.Domain })) : []
      };
      cache.set(cacheKey, { expires: now + CACHE_TTL_MS, data });
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    return { statusCode: 502, body: "Upstream error" };
  } catch {
    return { statusCode: 502, body: "Network error" };
  }
};
