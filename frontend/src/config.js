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

const API_BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiBase();

export function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}