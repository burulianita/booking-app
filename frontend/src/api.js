const BASE = "http://localhost/booking-app/backend/index.php";

function buildUrl(path) {
  const p = String(path || "").trim();
  if (!p) return BASE;

  
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  
  const base = BASE.replace(/\/+$/, "");
  const cleanPath = p.startsWith("/") ? p : `/${p}`;

  return `${base}${cleanPath}`;
}

async function request(path, options = {}) {
  const url = buildUrl(path);

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    
    throw new Error(`Hálózati hiba (fetch): ${err?.message || "ismeretlen"}`);
  }

  
  const contentType = res.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    
    data = { raw: text };
  }

  if (!res.ok) {
    
    const msg =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`;

    
    throw new Error(`${msg} (URL: ${url})`);
  }

  return data;
}

export function apiGet(path) {
  return request(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
}


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
