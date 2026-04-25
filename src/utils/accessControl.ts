import type { AuthUser } from "@/utils/authSession";

export type UserRole =
  | "manager"
  | "dev"
  | "kadiv"
  | "admin"
  | "adm"
  | "karyawan"
  | "unknown";

export interface EmployeeScopeItem {
  id: number;
  departemen_id?: number | null;
  role?: string | null;
}

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function normalizeRole(role: string | null | undefined): UserRole {
  const normalized = normalizeText(role);
  if (normalized === "manager") return "manager";
  if (normalized === "dev" || normalized === "developer") return "dev";
  if (normalized === "kadiv") return "kadiv";
  if (normalized === "karyawan" || normalized === "employee" || normalized === "staff") return "karyawan";
  if (normalized === "admin") return "admin";
  if (normalized.startsWith("adm")) return "adm";
  return "unknown";
}

export function isManagerRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "manager";
}

export function isDevRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "dev";
}

export function isKadivRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "kadiv";
}

export function isAdminLikeRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "adm";
}

export function isKaryawanRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "karyawan";
}

export function canAccessAuditLogs(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "manager" || normalized === "dev";
}

export function isReadOnlyBusinessRole(role: string | null | undefined): boolean {
  return isAdminLikeRole(role) || isKaryawanRole(role);
}

export function canUseManagementActions(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "manager" || normalized === "kadiv";
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
    const allowed = [
      "/dashboards",
      "/apps/divisi",
      "/apps/karyawan",
      "/apps/report",
    ];
    return Boolean(path && allowed.some((item) => path.startsWith(item)));
  }

  if (isKaryawanRole(role)) {
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
    { prefix: "/apps/karyawan", anyOf: ["employee_view"] },
    { prefix: "/apps/divisi", anyOf: ["department_view"] },
    { prefix: "/apps/periode-kpi", anyOf: ["periode_view", "periode_manage"] },
    { prefix: "/apps/data-kpi", anyOf: ["kpi_view", "kpi_manage", "spk_calculate"] },
    { prefix: "/apps/perbandingan", anyOf: ["spk_view", "spk_manage", "spk_calculate"] },
    { prefix: "/apps/penilaian", anyOf: ["spk_view", "spk_manage", "score_input"] },
    { prefix: "/apps/report", anyOf: ["spk_view", "spk_calculate"] },
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
    return employees.filter((employee) => employee.id === user.employee_id);
  }

  if (isAdminLikeRole(role) && user?.dept_id) {
    return employees.filter((employee) => Number(employee.departemen_id ?? 0) === Number(user.dept_id));
  }

  if (isKadivRole(role)) {
    return employees.filter((employee) => {
      const employeeRole = normalizeRole(employee.role || "");
      return employeeRole !== "manager";
    });
  }

  return employees;
}
