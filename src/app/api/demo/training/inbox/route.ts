import { NextRequest, NextResponse } from "next/server";
import {
  clearDemoTrainingEmails,
  listDemoTrainingEmails,
  markDemoTrainingEmailOpened,
} from "@/lib/demo/training";
import { isLocalDemoAdmin } from "@/lib/demo/request-guards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  return NextResponse.json({ emails: listDemoTrainingEmails() });
}

export async function PATCH(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  let id: unknown;
  try {
    ({ id } = await request.json());
  } catch {
    return NextResponse.json({ error: "Choose an email to mark opened." }, { status: 400 });
  }
  if (typeof id !== "string" || !markDemoTrainingEmailOpened(id)) {
    return NextResponse.json({ error: "The email could not be found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  clearDemoTrainingEmails();
  return NextResponse.json({ success: true });
}
