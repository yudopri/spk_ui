export interface AuthUser {
  id: number;
  employee_id: number | null;
  name: string;
  role: string;
  dept_id: number | null;
  lokasi_kerja: string | null;
}

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  permissions: string[];
}

const STORAGE_KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  user: "auth_user",
  permissions: "permissions",
  role: "userRole",
  userName: "userName",
  employeeId: "employeeId",
  deptId: "deptId",
  lokasiKerja: "lokasiKerja",
  legacyAccessToken: "token",
  legacyRefreshToken: "refreshToken",
} as const;

const COOKIE_MAX_AGE = 60 * 60 * 24;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
}

export function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.accessToken) || localStorage.getItem(STORAGE_KEYS.legacyAccessToken) || "";
}

export function getRefreshToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.refreshToken) || localStorage.getItem(STORAGE_KEYS.legacyRefreshToken) || "";
}

export function getStoredPermissions(): string[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<string[]>(localStorage.getItem(STORAGE_KEYS.permissions), []);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  return safeJsonParse<AuthUser | null>(localStorage.getItem(STORAGE_KEYS.user), null);
}

export function setSession(payload: AuthSessionPayload): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.accessToken, payload.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, payload.refreshToken);
  localStorage.setItem(STORAGE_KEYS.legacyAccessToken, payload.accessToken);
  localStorage.setItem(STORAGE_KEYS.legacyRefreshToken, payload.refreshToken);

  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(payload.user));
  localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(payload.permissions || []));
  localStorage.setItem(STORAGE_KEYS.role, payload.user.role || "");
  localStorage.setItem(STORAGE_KEYS.userName, payload.user.name || "");
  localStorage.setItem(STORAGE_KEYS.employeeId, payload.user.employee_id?.toString() || "");
  localStorage.setItem(STORAGE_KEYS.deptId, payload.user.dept_id?.toString() || "");
  localStorage.setItem(STORAGE_KEYS.lokasiKerja, payload.user.lokasi_kerja || "");

  setCookie("token", payload.accessToken);
  setCookie("permissions", JSON.stringify(payload.permissions || []));
  setCookie("userRole", payload.user.role || "");
}

export function updateAccessToken(accessToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.legacyAccessToken, accessToken);
  setCookie("token", accessToken);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  clearCookie("token");
  clearCookie("permissions");
  clearCookie("userRole");
}
