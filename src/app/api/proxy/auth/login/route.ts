import { NextRequest, NextResponse } from "next/server";

const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 jam

function setTokenCookie(
  response: NextResponse,
  name: string,
  value: string
): void {
  response.cookies.set(name, value, {
    httpOnly: true,         // Tidak bisa diakses oleh JavaScript
    secure: true,           // Hanya dikirim via HTTPS
    sameSite: "strict",     // Tidak dikirim cross-origin (anti-CSRF)
    path: "/",              // Berlaku untuk semua path
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.API_HOST}/api/auth/login`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("accept-encoding");

  try {
    const body = await request.arrayBuffer();
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
      // @ts-ignore
      duplex: "half",
    });

    const responseData = await response.json();

    // ── Ekstrak token dari response backend ──
    const data = responseData?.data && typeof responseData.data === "object"
      ? responseData.data
      : responseData;

    const accessToken =
      data?.access_token || data?.token ||
      responseData?.access_token || responseData?.token || "";
    const refreshToken =
      data?.refresh_token || data?.refreshToken ||
      responseData?.refresh_token || responseData?.refreshToken || "";

    // ── Bangun response baru (tanpa token di body) ──
    const safeBody = { ...responseData };

    // Hapus token dari body agar tidak terlihat di Network tab
    if (safeBody.data && typeof safeBody.data === "object") {
      const { access_token, token, refresh_token, refreshToken, ...safeData } = safeBody.data;
      safeBody.data = safeData;
    }
    // Hapus token dari level atas juga
    if (safeBody.access_token) delete safeBody.access_token;
    if (safeBody.token) delete safeBody.token;
    if (safeBody.refresh_token) delete safeBody.refresh_token;
    if (safeBody.refreshToken) delete safeBody.refreshToken;

    const nextResponse = NextResponse.json(safeBody, {
      status: response.status,
    });

    // ── Set token sebagai HttpOnly cookie ──
    if (accessToken) {
      setTokenCookie(nextResponse, "access_token", accessToken);
    }
    if (refreshToken) {
      setTokenCookie(nextResponse, "refresh_token", refreshToken);
    }

    // Set user role & permissions di cookie (bukan HttpOnly, agar middleware bisa baca)
    const userRole = data?.user?.role || responseData?.user?.role || "";
    const permissions = data?.permissions || responseData?.permissions || [];

    if (userRole) {
      nextResponse.cookies.set("userRole", userRole, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "strict",
      });
    }
    nextResponse.cookies.set("permissions", JSON.stringify(permissions), {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "strict",
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal terhubung ke server" },
      { status: 502 }
    );
  }
}