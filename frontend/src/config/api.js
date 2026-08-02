function getApiBaseUrl() {
  const envVal = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (typeof envVal === "string" && envVal.trim()) {
    return envVal.trim().replace(/\/$/, "");
  }

  return "";
}

const API_BASE_URL = getApiBaseUrl();

export function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanPath}`;
  }

  return cleanPath;
}

export const API_URL = API_BASE_URL || "";
