import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const targetUrl = `http://127.0.0.1:5000/api/auth/login`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

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
      if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'transfer-encoding') {
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
