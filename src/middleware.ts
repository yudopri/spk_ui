import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proxy API Request (e.g., from /api/proxy/* to https://localhost:7243/api/*)
  if (pathname.startsWith("/api/proxy")) {
    const targetPath = pathname.replace("/api/proxy", "/api");
    // Use 127.0.0.1 instead of localhost to avoid potential DNS/IPv6 issues in Node.js
    const apiHost = process.env.NEXT_PUBLIC_API_HOST?.replace("localhost", "127.0.0.1") || "https://127.0.0.1:7243";
    const targetUrl = new URL(targetPath, apiHost);

    // ForwardSearchParams if any
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const headers = new Headers(request.headers);
    headers.set("host", targetUrl.host);

    // Remove headers that might cause issues with proxying to localhost/C#
    headers.delete("connection");
    headers.delete("content-length");

    try {
      // Create a new controller to avoid issues with body streaming if needed, 
      // but for localhost/Kestrel common issues are SSL and headers.
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        // @ts-ignore
        duplex: 'half',
      });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      console.error("Proxy error:", error);
      return NextResponse.json({ success: false, message: "Proxy Connection Error" }, { status: 502 });
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
