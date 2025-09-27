import axios, { AxiosRequestConfig } from "axios";

const DATA_URI_REGEX = /^\s*data:/i;

const isDataScheme = (value?: string | null) =>
  typeof value === "string" && DATA_URI_REGEX.test(value);

const shouldBlockRequest = (config: AxiosRequestConfig) => {
  if (isDataScheme(config.url) || isDataScheme(config.baseURL)) {
    return true;
  }

  const candidate = `${config.baseURL ?? ""}${config.url ?? ""}`;
  if (isDataScheme(candidate)) {
    return true;
  }

  try {
    const resolved = new URL(
      config.url ?? "",
      config.baseURL ?? (typeof window !== "undefined" ? window.location.origin : undefined)
    );
    if (resolved.protocol === "data:") {
      return true;
    }
  } catch (error) {
    // If URL construction fails we let axios handle it later
  }

  return false;
};

export const setupAxiosSecurity = () => {
  axios.interceptors.request.use((config) => {
    if (shouldBlockRequest(config)) {
      return Promise.reject(
        new Error(
          "Blocked data: URL scheme to prevent unbounded memory usage through axios Node adapter"
        )
      );
    }
    return config;
  });
};

