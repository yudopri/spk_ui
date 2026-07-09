export interface AuthUser {
  id: number;
  employee_id: number | null;
  name: string;
  role: string;
  dept_id: number | null;
  lokasi_kerja: string | null;
}

export interface AuthSessionPayload {
  user: AuthUser;
  permissions: string[];
}

/**
 * Manajemen session — TOKEN DISIMPAN DI HttpOnly COOKIE (server-side).
 * File ini HANYA menyimpan data user di localStorage untuk keperluan UI.
 * Token (access_token, refresh_token) TIDAK BOLEH disimpan di localStorage
 * agar tidak rentan terhadap serangan XSS.
 */

const STORAGE_KEYS = {
  user: "auth_user",
  permissions: "permissions",
  role: "userRole",
  userName: "userName",
  employeeId: "employeeId",
  deptId: "deptId",
  lokasiKerja: "lokasiKerja",
} as const;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ── Token di HttpOnly cookie: tidak bisa diakses dari JS ──
// Middleware akan meng-inject token ke Authorization header secara otomatis.

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

  // Simpan data user & permissions di localStorage (untuk UI)
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(payload.user));
  localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(payload.permissions || []));
  localStorage.setItem(STORAGE_KEYS.role, payload.user.role || "");
  localStorage.setItem(STORAGE_KEYS.userName, payload.user.name || "");
  localStorage.setItem(STORAGE_KEYS.employeeId, payload.user.employee_id?.toString() || "");
  localStorage.setItem(STORAGE_KEYS.deptId, payload.user.dept_id?.toString() || "");
  localStorage.setItem(STORAGE_KEYS.lokasiKerja, payload.user.lokasi_kerja || "");

  // Token TIDAK disimpan di localStorage — sudah di HttpOnly cookie
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  // Hapus data user dari localStorage
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  // Bersihkan cookie via API logout (atau langsung clear kalau perlu)
  fetch("/api/proxy/auth/logout", { method: "POST" }).catch(() => {});
}
