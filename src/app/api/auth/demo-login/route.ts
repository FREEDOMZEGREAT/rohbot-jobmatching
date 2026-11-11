import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isLocalDemoRequest } from "@/lib/demo/request-guards";

const DEMO_ROLES = ["employer", "admin"] as const;
type DemoRole = (typeof DEMO_ROLES)[number];

function isDemoRole(role: unknown): role is DemoRole {
  return typeof role === "string" && DEMO_ROLES.some((demoRole) => demoRole === role);
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Demo sign-in is unavailable in production." }, { status: 404 });
  }
  if (!isLocalDemoRequest(request)) {
    return NextResponse.json({ error: "Demo sign-in is only available locally." }, { status: 403 });
  }

  let role: unknown;
  try {
    ({ role } = await request.json());
  } catch {
    return NextResponse.json({ error: "Choose a valid demo role." }, { status: 400 });
  }

  if (!isDemoRole(role)) {
    return NextResponse.json({ error: "Choose a valid demo role." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  const cookieOptions = {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 4,
  };

  response.cookies.set("rohobot_session", `demo-${randomUUID()}`, cookieOptions);
  response.cookies.set("rohobot_role", role, cookieOptions);

  return response;
}
