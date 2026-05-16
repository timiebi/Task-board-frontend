/** NEXT_PUBLIC_* is inlined at build time; wrangler vars alone are not enough on Cloudflare. */
export function getApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    return "https://task-tribe-backend.onrender.com/api";
  }
  return "http://127.0.0.1:8000/api";
}
