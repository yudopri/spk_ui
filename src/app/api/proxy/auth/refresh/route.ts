import { NextRequest, NextResponse } from "next/server";

const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 jam

function setTokenCookie(
  response: NextResponse,
  name: string,
  value: string
): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.API_HOST}/api/auth/refresh`;

  // ── Ambil refresh_token dari HttpOnly cookie ──
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "Refresh token tidak tersedia" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      // @ts-ignore
      duplex: "half",
    });

    const responseData = await response.json();

    // ── Ekstrak token baru dari response ──
    const data = responseData?.data && typeof responseData.data === "object"
      ? responseData.data
      : responseData;

    const newAccessToken =
      data?.access_token || data?.token ||
      responseData?.access_token || responseData?.token || "";
    const newRefreshToken =
      data?.refresh_token || data?.refreshToken ||
      responseData?.refresh_token || responseData?.refreshToken || "";

    // ── Bangun response tanpa token di body ──
    const safeBody = { ...responseData };
    if (safeBody.data && typeof safeBody.data === "object") {
      const { access_token, token, refresh_token, refreshToken, ...safeData } = safeBody.data;
      safeBody.data = safeData;
    }
    if (safeBody.access_token) delete safeBody.access_token;
    if (safeBody.token) delete safeBody.token;
    if (safeBody.refresh_token) delete safeBody.refresh_token;
    if (safeBody.refreshToken) delete safeBody.refreshToken;

    const nextResponse = NextResponse.json(safeBody, {
      status: response.status,
    });

    // ── Set token baru sebagai HttpOnly cookie ──
    if (newAccessToken) {
      setTokenCookie(nextResponse, "access_token", newAccessToken);
    }
    if (newRefreshToken) {
      setTokenCookie(nextResponse, "refresh_token", newRefreshToken);
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui sesi" },
      { status: 502 }
    );
  }
}