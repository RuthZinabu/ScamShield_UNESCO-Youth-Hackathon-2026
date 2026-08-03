const AUTH_STORAGE_KEY = "scamshield-is-authenticated";
const AUTH_TOKEN_STORAGE_KEY = "scamshield-auth-token";
const AUTH_USER_STORAGE_KEY = "scamshield-auth-user";

export type AuthUser = {
  id: number;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

export function getIsAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function setAuthenticated(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, value ? "true" : "false");
}

export function saveAuthSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  setAuthenticated(true);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  setAuthenticated(false);
}

export function getAuthSession(): { token: string | null } | null {
  if (typeof window === "undefined") return null;
  const token = getAuthToken();
  return token ? { token } : null;
}
