import { NextRequest, NextResponse } from "next/server";

function clearCookie(response: NextResponse, name: string): void {
  response.cookies.set(name, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.API_HOST}/api/auth/logout`;

  // Ambil refresh_token untuk dikirim ke backend agar bisa di-invalidate
  const refreshToken = request.cookies.get("refresh_token")?.value;

  try {
    const headers: Record<string, string> = {};
    if (refreshToken) {
      headers["Authorization"] = `Bearer ${refreshToken}`;
    }

    await fetch(targetUrl, {
      method: "POST",
      headers,
      // @ts-ignore
      duplex: "half",
    });
  } catch {
    // Tetap lanjut hapus cookie lokal meskipun backend gagal
  }

  // ── Bersihkan semua auth cookie ──
  const nextResponse = NextResponse.json(
    { success: true, message: "Berhasil logout" },
    { status: 200 }
  );

  clearCookie(nextResponse, "access_token");
  clearCookie(nextResponse, "refresh_token");
  clearCookie(nextResponse, "userRole");
  clearCookie(nextResponse, "permissions");

  return nextResponse;
}