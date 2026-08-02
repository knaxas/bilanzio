function getDefaultApiBase() {
  try {
    return window.location.origin;
  } catch (e) {
    return "http://localhost";
  }
}

const envVal = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const API_BASE_URL = (envVal && String(envVal).trim()) || getDefaultApiBase();

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const API_URL = API_BASE_URL;
