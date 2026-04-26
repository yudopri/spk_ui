import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute, normalizeRole } from "@/utils/accessControl";

function appendVaryHeader(response: NextResponse, value: string) {
  const current = response.headers.get("Vary");
  if (!current) {
    response.headers.set("Vary", value);
    return;
  }

  const values = new Set(
    current
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => values.add(item));

  response.headers.set("Vary", Array.from(values).join(", "));
}

function applyNoCacheHeaders(response: NextResponse, pathname: string): NextResponse {
  // Prevent CDN/proxy from caching RSC flight responses as full HTML documents.
  appendVaryHeader(response, "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept");

  if (!pathname.startsWith("/api") && !pathname.includes(".")) {
    response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  }

  return response;
}

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
    return applyNoCacheHeaders(NextResponse.redirect(url), pathname);
  }

  if (token && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboards"; // Changed from "/" to "/dashboards"
    return applyNoCacheHeaders(NextResponse.redirect(url), pathname);
  }

  // 3. Role-Based Access Control (RBAC) Logic
  if (token && pathname.startsWith("/apps/")) {
    const payload = decodeJwt(token);
    const userRole = payload?.role || payload?.Role || request.cookies.get("userRole")?.value || "";
    const cookiePermissions = parseCookiePermissions(request.cookies.get("permissions")?.value);
    const claimPermissions = normalizePermissions(
      payload?.permissions ?? payload?.Permission ?? payload?.permission ?? payload?.permissions_array ?? []
    );
    const permissions = cookiePermissions.length > 0 ? cookiePermissions : claimPermissions;
    const isAllowed = canAccessRoute(pathname, normalizeRole(userRole), permissions);

    if (!isAllowed) {
      console.warn(`User unauthorized for ${pathname}. Permissions: ${permissions.join(",")}`);
      const url = request.nextUrl.clone();
      url.pathname = "/403"; // Specific 403 page instead of generic dashboard
      return applyNoCacheHeaders(NextResponse.redirect(url), pathname);
    }
  }

  return applyNoCacheHeaders(NextResponse.next(), pathname);
}
