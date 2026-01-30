// frontend/src/api.js

// XAMPP + PHP backend base
// Ezeket a végpontokat fogjuk hívni:
//   GET  {BASE}/services
//   GET  {BASE}/slots?date=...&duration_min=...
//   POST {BASE}/bookings
const BASE = "http://localhost/booking-app/backend/index.php";

/**
 * Biztosan összeilleszt egy BASE + path párost.
 * path lehet: "/services" vagy "services"
 */
function buildUrl(path) {
  const p = String(path || "").trim();
  if (!p) return BASE;

  // ha valaki véletlenül teljes URL-t adna át
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  // BASE végéről le, path elejére fel a perjelek
  const base = BASE.replace(/\/+$/, "");
  const cleanPath = p.startsWith("/") ? p : `/${p}`;

  return `${base}${cleanPath}`;
}

/**
 * Közös fetch wrapper (GET/POST)
 */
async function request(path, options = {}) {
  const url = buildUrl(path);

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    // tipikusan: backend nem fut / CORS / rossz port / offline
    throw new Error(`Hálózati hiba (fetch): ${err?.message || "ismeretlen"}`);
  }

  // próbáljuk JSON-ként olvasni, de ha nem JSON, akkor text
  const contentType = res.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    // ha nem JSON, visszaadjuk szövegként
    data = { raw: text };
  }

  if (!res.ok) {
    // a backend nálad {"error":"..."} formában szokott válaszolni
    const msg =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`;

    // debug: hasznos látni mit hívott
    throw new Error(`${msg} (URL: ${url})`);
  }

  return data;
}

/**
 * GET kérés
 * Példa:
 *   apiGet("/services")
 *   apiGet(`/slots?date=${encodeURIComponent(date)}&duration_min=60`)
 */
export function apiGet(path) {
  return request(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * POST kérés JSON body-val
 * Példa:
 *   apiPost("/bookings", payload)
 */
export function apiPost(path, bodyObj) {
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(bodyObj ?? {}),
  });
}
