import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute, normalizeRole } from "@/utils/accessControl";

/**
 * Memperbaiki masalah RSC Payload dengan tidak memanipulasi header Vary 
 * secara manual pada NextResponse.redirect.
 */
function applyNoCacheHeaders(response: NextResponse, pathname: string): NextResponse {
  if (!pathname.startsWith("/api") && !pathname.includes(".")) {
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  }
  return response;
}

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Gunakan Buffer jika di Node, atau atob di Edge Runtime
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
    return normalizePermissions(JSON.parse(decoded));
  } catch {
    return [];
  }
}

export const config = {
  matcher: [
    /*
     * Match semua request kecuali:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico, images, dsb.
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const loginPath = "/auth/auth1/login";
  const isAuthPage = pathname.startsWith(loginPath);
  const isRoot = pathname === "/";

  // 1. PUBLIC ROUTE PROTECTION (Redirect ke Login)
  if (!token) {
    // Jika akses root atau halaman aplikasi tanpa token
    if (isRoot || (!isAuthPage && !pathname.startsWith("/api") && !pathname.includes("."))) {
      const url = new URL(loginPath, request.url);
      // PENTING: Jangan tambahkan custom header aneh pada redirect agar tidak muncul teks JSON
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. AUTHENTICATED REDIRECT (Sudah login tapi buka "/" atau "/login")
  if (token && (isAuthPage || isRoot)) {
    return NextResponse.redirect(new URL("/dashboards", request.url));
  }

  // 3. RBAC LOGIC
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
      console.warn(`Unauthorized: ${pathname}`);
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  // Gunakan no-cache hanya untuk request sukses (NextResponse.next)
  return applyNoCacheHeaders(NextResponse.next(), pathname);
}