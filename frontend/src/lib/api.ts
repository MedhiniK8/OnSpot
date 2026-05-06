/**
 * OnSpot API client
 * All requests go to http://127.0.0.1:8000
 * JWT token is read from localStorage (set during login/register)
 */

const BASE = "http://127.0.0.1:8000";

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("onspot_token");
}

export function setToken(token: string): void {
  localStorage.setItem("onspot_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("onspot_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface BackendUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
}

export async function apiRegister(
  email: string,
  password: string,
  fullName: string
): Promise<{ access_token: string; user: BackendUser }> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Register failed: ${res.status}`);
  }
  return res.json();
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ access_token: string; user: BackendUser }> {
  // FastAPI OAuth2PasswordRequestForm expects form-encoded username/password
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Login failed: ${res.status}`);
  }
  return res.json();
}

// ── Events ────────────────────────────────────────────────────────────────────
export interface ApiEvent {
  id: string;
  user_id: string | null;
  input_type: string;
  location: string | null;
  severity: string;
  accident_type: string;
  departments_alerted: string[];
  call_status: Record<string, string>;
  ai_decision: string | null;
  status: string;
  response_time_ms: number | null;
  created_at: string | null;
}

export interface EventListResponse {
  items: ApiEvent[];
  page: number;
  limit: number;
  total: number;
}

export async function apiGetEvents(page = 1, limit = 50): Promise<EventListResponse> {
  const res = await fetch(`${BASE}/events?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  return res.json();
}

// ── Analyze ───────────────────────────────────────────────────────────────────
export interface AnalyzeResult {
  event_id: string;
  input_type: string;
  decision_result: {
    severity: string;
    event_type: string;
    priority: string;
    departments_alerted: string[];
  };
  route_details: { location: string | null; recommended_action: string };
  alert_status: Record<string, string>;
  status: string;
  response_time_ms: number;
}

export async function apiAnalyzeText(
  location: string,
  incidentType: string,
  description: string
): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append("input_type", "text");
  form.append("text", `${incidentType}: ${description} at ${location}`);
  form.append("location", location);

  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Analysis failed: ${res.status}`);
  }
  return res.json();
}

export async function apiAnalyzeImage(file: File, location?: string): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append("input_type", "image");
  form.append("file", file);
  if (location) form.append("location", location);

  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Image analysis failed: ${res.status}`);
  }
  return res.json();
}

export async function apiAnalyzeVoice(
  transcript: string,
  location?: string
): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append("input_type", "voice");
  form.append("text", transcript);
  if (location) form.append("location", location);

  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Voice analysis failed: ${res.status}`);
  }
  return res.json();
}
