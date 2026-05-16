import axios, { isAxiosError } from "axios";
import { clearAuth, getToken } from "./auth";
import { getApiUrl } from "./get-api-url";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type RequestListener = (ok: boolean, error?: string) => void;
const listeners = new Set<RequestListener>();

export function onApiStatus(listener: RequestListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(ok: boolean, error?: string) {
  listeners.forEach((fn) => fn(ok, error));
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    if (typeof o.error === "string") return o.error;
  }
  return fallback;
}

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    notify(true);
    return response;
  },
  (error: unknown) => {
    if (!isAxiosError(error)) {
      notify(false, "Cannot reach server. Is the backend running?");
      throw new ApiError("Network error", 0);
    }

    const status = error.response?.status ?? 0;

    if (!error.response) {
      notify(false, "Cannot reach server. Is the backend running?");
      throw new ApiError("Network error", 0);
    }

    if (status === 401) {
      clearAuth();
      notify(false, "Session expired. Please sign in again.");
      throw new ApiError("Unauthorized", 401);
    }

    const detail = messageFromBody(
      error.response.data,
      `Request failed (${status})`
    );
    notify(false, detail);
    throw new ApiError(detail, status);
  }
);

export async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  data?: unknown
): Promise<T> {
  const res = await apiClient.request<T>({
    method,
    url: path,
    data,
  });
  return res.data;
}
