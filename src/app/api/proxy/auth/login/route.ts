import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/login`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  // TAMBAHAN 1: Minta backend jangan melakukan kompresi gzip
  headers.delete("accept-encoding"); 

  try {
    const body = await request.arrayBuffer();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: 'half',
    });

    const responseData = await response.json();

    // Remove content-length and other sensitive headers to avoid mismatch
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'content-length' && 
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'content-encoding' // TAMBAHAN 2: Pastikan gzip tidak ikut ke browser
      ) {
        responseHeaders.set(key, value);
      }
    });

    return NextResponse.json(responseData, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "Proxy Connection Error", 
      detail: error.message 
    }, { status: 502 });
  }
}