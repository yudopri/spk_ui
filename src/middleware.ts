import { NextRequest, NextResponse } from "next/server";

// Helper function to decode JWT in Edge Runtime (Base64 only, no verification)
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.name || item.permission || item.code || "";
      }
      return "";
    })
    .filter((item: string) => Boolean(item));
}

function parseCookiePermissions(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as unknown;
    return normalizePermissions(parsed);
  } catch {
    return [];
  }
}

const ROUTE_PERMISSION_RULES: Array<{ prefix: string; anyOf: string[] }> = [
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. Auth Protection Logic
  const token = request.cookies.get("token")?.value;
  const isAuthPage = pathname.startsWith("/auth/auth1/login");

  if (!token && !isAuthPage && !pathname.startsWith("/api") && !pathname.includes(".")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/auth1/login";
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboards"; // Changed from "/" to "/dashboards"
    return NextResponse.redirect(url);
  }

  // 3. Role-Based Access Control (RBAC) Logic
  if (token && pathname.startsWith("/apps/")) {
    const payload = decodeJwt(token);
    const userRole = payload?.role || payload?.Role || "";
    const cookiePermissions = parseCookiePermissions(request.cookies.get("permissions")?.value);
    const claimPermissions = normalizePermissions(
      payload?.permissions ?? payload?.Permission ?? payload?.permission ?? payload?.permissions_array ?? []
    );
    const permissions = cookiePermissions.length > 0 ? cookiePermissions : claimPermissions;

    // Admin & Developer bypass everything in /apps/
    if (userRole === "Admin" || userRole === "Developer") {
      return NextResponse.next();
    }

    // Check if user has permission for the current path
    const matchedRule = ROUTE_PERMISSION_RULES.find((rule) => pathname.startsWith(rule.prefix));
    const isAllowed = !matchedRule || matchedRule.anyOf.some((perm) => permissions.includes(perm));

    if (!isAllowed) {
      console.warn(`User unauthorized for ${pathname}. Permissions: ${permissions.join(",")}`);
      const url = request.nextUrl.clone();
      url.pathname = "/403"; // Specific 403 page instead of generic dashboard
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
