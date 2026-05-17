import axios, { isAxiosError } from "axios";
import { clearAuth, getToken } from "./auth";
import { getApiUrl } from "./get-api-url";
import { friendlyApiMessage, USER_MESSAGES } from "./user-messages";

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
      notify(false, USER_MESSAGES.network);
      throw new ApiError(USER_MESSAGES.network, 0);
    }

    const status = error.response?.status ?? 0;

    if (error.code === "ECONNABORTED") {
      notify(false, USER_MESSAGES.timeout);
      throw new ApiError(USER_MESSAGES.timeout, 0);
    }

    if (!error.response) {
      notify(false, USER_MESSAGES.network);
      throw new ApiError(USER_MESSAGES.network, 0);
    }

    if (status === 401) {
      const path = error.config?.url ?? "";
      const isAuthAttempt =
        path.includes("/auth/login") || path.includes("/auth/register");
      const message = isAuthAttempt
        ? friendlyApiMessage(error.response.data, status)
        : USER_MESSAGES.sessionExpired;
      if (!isAuthAttempt) {
        clearAuth();
      }
      notify(false, message);
      throw new ApiError(message, 401);
    }

    const message = friendlyApiMessage(error.response.data, status);
    notify(false, message);
    throw new ApiError(message, status);
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
