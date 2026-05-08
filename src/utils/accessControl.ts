import type { AuthUser } from "@/utils/authSession";

export type UserRole =
  | "Manager"
  | "Dev"
  | "Hrd"
  | "Kadiv"
  | "Admin"
  | "Adm"
  | "Karyawan"
  | "unknown";

export interface EmployeeScopeItem {
  id: number;
  departemen_id?: number | null;
  dept_id?: number | null;
  employee_id?: number | null;
  lokasi_kerja?: string | null;
  role?: string | null;
}

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function normalizeRole(role: string | null | undefined): UserRole {
  const normalized = (role || "").trim();
  if (normalized === "Manager") return "Manager";
  if (normalized === "Dev" || normalized === "Developer") return "Dev";
  if (normalized === "Hrd") return "Hrd";
  if (normalized === "Kadiv") return "Kadiv";
  if (normalized === "Karyawan" || normalized === "Employee" || normalized === "Staff") return "Karyawan";
  if (normalized === "Admin") return "Admin";
  if (normalized.toLowerCase().startsWith("adm")) return "Adm";
  return "unknown";
}

export function isManagerRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "Manager";
}

export function isDevRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "Dev";
}

export function isKadivRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "Kadiv";
}

export function isHrdRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "Hrd";
}

export function isAdminLikeRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "Admin" || normalized === "Adm" || normalized === "Hrd";
}

export function isKaryawanRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "Karyawan";
}

export function canAccessAuditLogs(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "Manager" || normalized === "Dev" || normalized === "Hrd";
}

export function isReadOnlyBusinessRole(role: string | null | undefined): boolean {
  return isAdminLikeRole(role) || isKaryawanRole(role);
}

export function canUseManagementActions(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "Manager" || normalized === "Kadiv";
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canSeeMenuItem(role: string | null | undefined, permissions: string[], permission?: string, path?: string): boolean {
  if (isManagerRole(role)) return true;

  if (path?.startsWith("/apps/developer")) {
    return canAccessAuditLogs(role);
  }

  if (isAdminLikeRole(role)) {
    if (!path) {
      return !permission || permissions.includes(permission);
    }
    const allowed = [
      "/dashboards",
      "/apps/divisi",
      "/apps/karyawan",
      "/apps/periode-kpi",
      "/apps/data-kpi",
      "/apps/report",
    ];
    return Boolean(path && allowed.some((item) => path.startsWith(item)));
  }

  if (isKaryawanRole(role)) {
    if (!path) {
      return !permission || permissions.includes(permission);
    }
    const allowed = ["/dashboards", "/apps/karyawan", "/apps/report"];
    return Boolean(path && allowed.some((item) => path.startsWith(item)));
  }

  if (!permission) return true;
  return hasPermission(permissions, permission);
}

export function canAccessRoute(pathname: string, role: string | null | undefined, permissions: string[]): boolean {
  if (!pathname.startsWith("/apps/")) return true;
  if (isManagerRole(role)) return true;

  if (pathname.startsWith("/apps/developer")) {
    return canAccessAuditLogs(role);
  }

  if (isAdminLikeRole(role)) {
    return ["/apps/divisi", "/apps/karyawan", "/apps/periode-kpi", "/apps/data-kpi", "/apps/report"].some((path) => pathname.startsWith(path));
  }

  if (isKaryawanRole(role)) {
    return ["/apps/karyawan", "/apps/report"].some((path) => pathname.startsWith(path));
  }

  if (isKadivRole(role)) {
    if (["/apps/user", "/apps/role", "/apps/permission", "/apps/developer"].some((path) => pathname.startsWith(path))) {
      return false;
    }
  }

  const permissionRules: Array<{ prefix: string; anyOf: string[] }> = [
    { prefix: "/apps/karyawan", anyOf: ["karyawan_view", "employee_view"] },
    { prefix: "/apps/divisi", anyOf: ["divisi_view", "department_view"] },
    { prefix: "/apps/periode-kpi", anyOf: ["periode_view", "periode_manage"] },
    { prefix: "/apps/data-kpi", anyOf: ["kpi_view", "kpi_manage", "spk_calculate"] },
    { prefix: "/apps/perbandingan", anyOf: ["kpi_manage", "spk_view", "spk_manage", "spk_calculate"] },
    { prefix: "/apps/penilaian", anyOf: ["score_view", "score_input", "spk_view", "spk_manage"] },
    { prefix: "/apps/report", anyOf: ["report_view", "report_personal", "spk_view", "spk_calculate"] },
    { prefix: "/apps/user", anyOf: ["user_manage"] },
    { prefix: "/apps/role", anyOf: ["user_manage"] },
    { prefix: "/apps/permission", anyOf: ["user_manage"] },
  ];

  const matched = permissionRules.find((rule) => pathname.startsWith(rule.prefix));
  if (!matched) return true;
  return matched.anyOf.some((permission) => permissions.includes(permission));
}

export function filterEmployeesByRoleScope<T extends EmployeeScopeItem>(
  employees: T[],
  role: string | null | undefined,
  user: AuthUser | null
): T[] {
  if (isKaryawanRole(role) && user?.employee_id) {
    return employees.filter((employee) => {
      const currentEmployeeId = Number(user.employee_id ?? 0);
      const employeeId = Number(employee.employee_id ?? employee.id ?? 0);
      return employeeId === currentEmployeeId;
    });
  }

  if (isKadivRole(role)) {
    return employees.filter((employee) => {
      const employeeRole = normalizeRole(employee.role || "");
      return employeeRole !== "Manager";
    });
  }

  return employees;
}
