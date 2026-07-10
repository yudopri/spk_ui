import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute, normalizeRole } from "@/utils/accessControl";

// ─── Helpers ───────────────────────────────────────────────────

function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object")
        return item.name || item.permission || item.code || "";
      return "";
    })
    .filter((item: string) => Boolean(item));
}

function parseCookiePermissions(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    return normalizePermissions(JSON.parse(decoded));
  } catch {
    return [];
  }
}

function isAssetRequest(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname === "/favicon.ico") return true;
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

// ─── Security Headers ──────────────────────────────────────────

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  return response;
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set(
    "Vary",
    "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept, Accept-Encoding"
  );
  return response;
}

// ─── Config ────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match semua request kecuali:
     * 1. _next/static, _next/image (static assets)
     * 2. favicon.ico, images
     * 3. api/proxy/auth (login/refresh/logout — butuh cookie tanpa auth check)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|api/proxy/auth).*)",
  ],
};

// ─── Middleware (Next.js — auto-deteksi export名为 "middleware") ──

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through assets without modification
  if (isAssetRequest(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const loginPath = "/auth/auth1/login";
  const isAuthPage = pathname.startsWith(loginPath);
  const isRoot = pathname === "/";

  // ── 1. PUBLIC ROUTE PROTECTION ──
  if (!accessToken) {
    if (
      isRoot ||
      (!isAuthPage && !pathname.startsWith("/api") && !pathname.includes("."))
    ) {
      return addSecurityHeaders(
        noStore(NextResponse.redirect(new URL(loginPath, request.url)))
      );
    }
    return addSecurityHeaders(noStore(NextResponse.next()));
  }

  // ── 2. AUTHENTICATED REDIRECT ──
  if (accessToken && (isAuthPage || isRoot)) {
    return addSecurityHeaders(
      noStore(NextResponse.redirect(new URL("/dashboards", request.url)))
    );
  }

  // ── 3. TOKEN INJECTION: Inject access_token → Authorization header ──
  // Backend expects Bearer token in header; we read from HttpOnly cookie.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Authorization", `Bearer ${accessToken}`);

  // Also forward refresh_token for refresh endpoints
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (refreshToken && pathname.includes("/auth/refresh")) {
    requestHeaders.set("Authorization", `Bearer ${refreshToken}`);
  }

  // ── 4. RBAC LOGIC ──
  if (pathname.startsWith("/apps/")) {
    const payload = decodeJwt(accessToken);
    const userRole =
      payload?.role ||
      payload?.Role ||
      request.cookies.get("userRole")?.value ||
      "";

    const cookiePermissions = parseCookiePermissions(
      request.cookies.get("permissions")?.value
    );
    const claimPermissions = normalizePermissions(
      payload?.permissions ??
        payload?.Permission ??
        payload?.permission ??
        payload?.permissions_array ??
        []
    );

    const permissions =
      cookiePermissions.length > 0 ? cookiePermissions : claimPermissions;
    const isAllowed = canAccessRoute(
      pathname,
      normalizeRole(userRole),
      permissions
    );

    if (!isAllowed) {
      console.warn(`[RBAC] Unauthorized access attempt: ${pathname} (role: ${userRole})`);
      return addSecurityHeaders(
        noStore(NextResponse.redirect(new URL("/403", request.url)))
      );
    }
  }

  // ── 5. PROCEED with injected Authorization header ──
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return addSecurityHeaders(noStore(response));
}
