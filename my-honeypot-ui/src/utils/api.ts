import { useAuth0 } from "@auth0/auth0-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function useApi() {
  const { getAccessTokenSilently } = useAuth0();

  async function apiFetch(
    path: string,
    options: RequestInit = {},
    customBaseUrl?: string
  ) {
    const token = await getAccessTokenSilently();
    const url = `${customBaseUrl || API_BASE_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      let error;
      try {
        error = await res.json();
      } catch {
        error = { message: res.statusText };
      }
      throw error;
    }
    // Try to parse JSON, fallback to text
    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  }

  // Helper methods
  const get = (path: string) => apiFetch(path, { method: "GET" });
  const post = (path: string, body: any) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  const del = (path: string) => apiFetch(path, { method: "DELETE" });

  return { apiFetch, get, post, del };
}
