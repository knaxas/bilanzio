function getDefaultApiBase() {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }

  return "";
}

const API_BASE_URL = getDefaultApiBase();

export function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanPath}`;
  }

  return cleanPath;
}