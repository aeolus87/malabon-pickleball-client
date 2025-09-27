// Simple, LeadOn-style environment helpers for the client

// One flag to branch UI/debug behavior
export const IS_DEV = import.meta.env.DEV;

// Single API base used across the app
// In dev, Vite proxy should forward "/api" to the backend.
// In prod, Vercel (or your CDN) should rewrite "/api" to your backend.
export const API_BASE = "/api";

// Optional socket URL: prefer explicit, otherwise infer
// - If VITE_API_URL is present and ends with /api, strip it to get origin
// - Else: dev -> localhost backend, prod -> same origin
const apiFromEnv = (import.meta.env as any)?.VITE_API_URL as string | undefined;
const inferredFromApi = apiFromEnv && apiFromEnv.endsWith("/api")
  ? apiFromEnv.slice(0, -4)
  : undefined;

export const SOCKET_URL =
  (import.meta.env as any)?.VITE_SOCKET_URL ||
  inferredFromApi ||
  (IS_DEV ? "http://localhost:5000" : window.location.origin);
