import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/refresh`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  // TAMBAHAN 1: Cegah backend mengompresi balasan (menghindari ERR_CONTENT_DECODING_FAILED)
  headers.delete("accept-encoding"); 

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      // @ts-ignore
      duplex: 'half',
    });

    const responseData = await response.json();

    // TAMBAHAN 2: Tangkap header baru dari backend (termasuk Set-Cookie / Token baru)
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'content-length' && 
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'content-encoding' // Buang label kompresi agar browser tidak bingung
      ) {
        responseHeaders.set(key, value);
      }
    });

    return NextResponse.json(responseData, {
      status: response.status,
      headers: responseHeaders, // Teruskan header yang berisi token/sesi baru ke browser
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "Proxy Connection Error", 
      detail: error.message 
    }, { status: 502 });
  }
}