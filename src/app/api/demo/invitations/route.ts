import { NextRequest, NextResponse } from "next/server";
import {
  createDemoInvitation,
  listDemoInvitations,
  revokeDemoInvitation,
} from "@/lib/demo/invitations";
import { isLocalDemoAdmin } from "@/lib/demo/request-guards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  return NextResponse.json({ invitations: listDemoInvitations() });
}

export async function POST(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }

  try {
    await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid invitation request." }, { status: 400 });
  }

  try {
    const { invitation, token } = createDemoInvitation();
    const registrationUrl = new URL(`/invite/${token}`, request.nextUrl.origin).toString();
    return NextResponse.json({ invitation, registrationUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the invitation." },
      { status: 409 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }

  let id: unknown;
  try {
    ({ id } = await request.json());
  } catch {
    return NextResponse.json({ error: "Choose an invitation to revoke." }, { status: 400 });
  }
  if (typeof id !== "string" || !revokeDemoInvitation(id)) {
    return NextResponse.json({ error: "This pending invitation could not be revoked." }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
