export type UserRole = "admin" | "user";

export interface AuthUser {
  email: string;
  name: string;
  profession: string;
  role: UserRole;
}

const STORAGE_KEY = "onspot_user";
const TOKEN_KEY   = "onspot_token";

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/** Clears both the user profile and the JWT — call on logout */
export function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdmin(): boolean {
  return getUser()?.role === "admin";
}
