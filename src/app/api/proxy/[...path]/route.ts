import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = `${process.env.NEXT_PUBLIC_API_HOST}/api`;

function getPathSegmentsFromRequest(request: NextRequest): string[] {
  const prefix = "/api/proxy/";
  const pathname = request.nextUrl.pathname;
  const rawPath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
  return rawPath.split("/").filter(Boolean);
}

async function proxyRequest(request: NextRequest, method: string) {
  try {
    const pathSegments = getPathSegmentsFromRequest(request);
    const targetUrl = `${BACKEND_BASE_URL}/${pathSegments.join("/")}${request.nextUrl.search}`;

    // 1. CEGAH BACKEND MENGIRIM GZIP
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    headers.delete("accept-encoding"); // <-- TAMBAHAN 1: Paksa backend kirim plain text

    const hasBody = !["GET", "HEAD"].includes(method);
    const body = hasBody ? await request.arrayBuffer() : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      // @ts-ignore
      duplex: "half",
    });

    // 2. HAPUS CONTENT-ENCODING DARI RESPON
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "content-length" && 
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "content-encoding" // <-- TAMBAHAN 2: Cegah browser bingung
      ) {
        responseHeaders.set(key, value);
      }
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Proxy Connection Error",
        detail: error?.message || "Unknown proxy error",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, "PUT");
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "DELETE");
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request, "OPTIONS");
}
