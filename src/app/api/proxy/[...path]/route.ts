import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL = "https://api.github.com";

async function proxyRequest(req: NextRequest) {
  const token = req.headers.get("x-github-token");
  if (!token) {
    return NextResponse.json({ error: "Missing x-github-token header" }, { status: 401 });
  }

  const apiBase = req.headers.get("x-api-base-url") || DEFAULT_API_URL;
  const pathSegments = req.nextUrl.pathname.replace(/^\/api\/proxy/, "");
  const search = req.nextUrl.search;
  const targetUrl = `${apiBase}${pathSegments}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const responseBody = await res.text();

  return new NextResponse(responseBody || null, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
