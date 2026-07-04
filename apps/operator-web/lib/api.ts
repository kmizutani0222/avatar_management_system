function getApiUrl() {
  if (typeof window === 'undefined' && process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4003';
}

const API_URL = getApiUrl();

export async function fetchHealth() {
  try {
    const res = await fetch(`${getApiUrl()}/api/health`, { cache: 'no-store' });
    if (!res.ok) return { ok: false as const, data: null };
    const data = await res.json();
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, data: null };
  }
}

export { API_URL, getApiUrl };
