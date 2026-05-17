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

function notifyError(error: string) {
  listeners.forEach((fn) => fn(false, error));
}

function isRequiresLoginBody(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    "requires_login" in data &&
    (data as { requires_login?: boolean }).requires_login === true
  );
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
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError(error)) {
      notifyError(USER_MESSAGES.network);
      throw new ApiError(USER_MESSAGES.network, 0);
    }

    const status = error.response?.status ?? 0;

    if (error.code === "ECONNABORTED") {
      notifyError(USER_MESSAGES.timeout);
      throw new ApiError(USER_MESSAGES.timeout, 0);
    }

    if (!error.response) {
      notifyError(USER_MESSAGES.network);
      throw new ApiError(USER_MESSAGES.network, 0);
    }

    if (status === 401) {
      const path = error.config?.url ?? "";
      const isAuthAttempt =
        path.includes("/auth/login") || path.includes("/auth/register");
      const requiresLogin = isRequiresLoginBody(error.response.data);
      const message = isAuthAttempt
        ? friendlyApiMessage(error.response.data, status)
        : USER_MESSAGES.sessionExpired;

      if (!isAuthAttempt && !requiresLogin) {
        clearAuth();
      }

      notifyError(message);
      throw new ApiError(message, 401);
    }

    const message = friendlyApiMessage(error.response.data, status);
    notifyError(message);
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
