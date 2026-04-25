import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/logout`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  // TAMBAHAN 1: Cegah kompresi data
  headers.delete("accept-encoding"); 

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      // @ts-ignore
      duplex: 'half',
    });

    const responseData = await response.json();

    // TAMBAHAN 2: Salin header dari backend agar perintah hapus Cookie/Token bisa sampai ke browser
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'content-length' && 
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'content-encoding' // Buang kompresi gzip
      ) {
        responseHeaders.set(key, value);
      }
    });

    return NextResponse.json(responseData, {
      status: response.status,
      headers: responseHeaders, // Pasang header yang sudah disaring
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "Proxy Connection Error", 
      detail: error.message 
    }, { status: 502 });
  }
}