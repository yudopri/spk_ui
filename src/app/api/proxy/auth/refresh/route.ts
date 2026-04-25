import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const targetUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/refresh`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      // @ts-ignore
      duplex: 'half',
    });

    const responseData = await response.json();

    return NextResponse.json(responseData, {
      status: response.status,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "Proxy Connection Error", 
      detail: error.message 
    }, { status: 502 });
  }
}
