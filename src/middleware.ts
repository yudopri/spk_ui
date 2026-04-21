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

// Map permissions to application paths
const PERMISSION_MAP: Record<string, string[]> = {
  "divisi_view": ["/apps/divisi"],
  "divisi_create": ["/apps/divisi"],
  "divisi_update": ["/apps/divisi"],
  "divisi_delete": ["/apps/divisi"],
  "karyawan_view": ["/apps/karyawan"],
  "karyawan_create": ["/apps/karyawan"],
  "karyawan_update": ["/apps/karyawan"],
  "karyawan_delete": ["/apps/karyawan"],
  "kpi_view": ["/apps/data-kpi"],
  "kpi_manage": ["/apps/perbandingan", "/apps/data-kpi"],
  "periode_view": ["/apps/periode-kpi"],
  "periode_create": ["/apps/periode-kpi"],
  "periode_update": ["/apps/periode-kpi"],
  "periode_delete": ["/apps/periode-kpi"],
  "score_view": ["/apps/penilaian"],
  "score_input": ["/apps/penilaian"],
  "report_view": ["/apps/report"],
  "user_manage": ["/apps/user", "/apps/role", "/apps/permission"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proxy API Request (e.g., from /api/proxy/* to https://localhost:7243/api/*)
  if (pathname.startsWith("/api/proxy")) {
    const targetPath = request.nextUrl.pathname.replace("/api/proxy", "/api");
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `https://127.0.0.1:7243${targetPath}${searchParams ? '?' + searchParams : ''}`;

    const headers = new Headers(request.headers);
    headers.set("host", "127.0.0.1:7243");

    // Remove headers that might cause issues with proxying to localhost/C#
    headers.delete("connection");
    headers.delete("content-length");
    headers.delete("host"); // Let fetch set it from targetUrl

    try {
      console.log(`Proxying ${request.method} to: ${targetUrl}`);
      
      const body = (request.method !== 'GET' && request.method !== 'HEAD') ? await request.arrayBuffer() : undefined;

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: body,
        // @ts-ignore
        duplex: 'half',
      });

      // Special handling for 500 from backend to see if it's the backend itself
      if (response.status === 500) {
        console.error("Backend returned 500 error");
      }

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error: any) {
      console.error("Proxy Fetch Error Detail:", error.message, error.cause);
      return NextResponse.json({ 
        success: false, 
        message: "Proxy Connection Error", 
        detail: error.message 
      }, { status: 502 });
    }
  }

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
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 3. Role-Based Access Control (RBAC) Logic
  if (token && pathname.startsWith("/apps/")) {
    const payload = decodeJwt(token);
    const userRole = payload?.role;
    const permissions: string[] = Array.isArray(payload?.Permission) ? payload.Permission : [];

    // Admin & Developer bypass everything in /apps/
    if (userRole === "Admin" || userRole === "Developer") {
      return NextResponse.next();
    }

    // Check if user has permission for the current path
    const requiredPermission = Object.keys(PERMISSION_MAP).find(perm => 
      PERMISSION_MAP[perm].some(path => pathname.startsWith(path))
    );

    if (requiredPermission && !permissions.includes(requiredPermission)) {
      console.warn(`User unauthorized for ${pathname}. Required: ${requiredPermission}`);
      const url = request.nextUrl.clone();
      url.pathname = "/dashboards"; // Redirect to safe page
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
