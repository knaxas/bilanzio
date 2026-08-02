const DEFAULT_PORT = 5000;

function getDefaultApiBase() {
  try {
    const proto = window.location.protocol || "http:";
    const host = window.location.hostname || "localhost";
    return `${proto}//${host}:${DEFAULT_PORT}`;
  } catch (e) {
    return `http://localhost:${DEFAULT_PORT}`;
  }
}

const envVal = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const API_BASE_URL = (envVal && String(envVal).trim()) || getDefaultApiBase();

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const API_URL = API_BASE_URL;
