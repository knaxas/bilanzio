function getDefaultApiBase() {
  try {
    return window.location.origin;
  } catch (e) {
    return "http://localhost";
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiBase();

export function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
