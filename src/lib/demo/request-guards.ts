import type { NextRequest } from "next/server";

export function getDemoRequestOrigin(request: NextRequest): string {
  const host = request.headers.get("host");
  if (!host) return request.nextUrl.origin;

  try {
    return new URL(`${request.nextUrl.protocol}//${host}`).origin;
  } catch {
    return request.nextUrl.origin;
  }
}

export function isLocalDemoRequest(request: NextRequest): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    (request.nextUrl.protocol === "http:" || request.nextUrl.protocol === "https:")
  );
}

export function isLocalDemoAdmin(request: NextRequest): boolean {
  return (
    isLocalDemoRequest(request) &&
    request.cookies.get("rohobot_session")?.value?.startsWith("demo-") === true &&
    request.cookies.get("rohobot_role")?.value === "admin"
  );
}
