import { NextRequest, NextResponse } from "next/server";
import {
  listDemoReviewQueue,
  reviewDemoCandidate,
  reviewDemoEmployerPayment,
} from "@/lib/demo/invitations";
import { isLocalDemoAdmin } from "@/lib/demo/request-guards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  return NextResponse.json(listDemoReviewQueue());
}

export async function POST(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }

  let action: unknown;
  let id: unknown;
  let approved: unknown;
  let note: unknown;
  try {
    ({ action, id, approved, note } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid review action." }, { status: 400 });
  }
  if (typeof id !== "string" || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Choose an item and approval decision." }, { status: 400 });
  }

  const updated =
    action === "candidate"
      ? reviewDemoCandidate(id, approved)
      : action === "payment"
        ? reviewDemoEmployerPayment(id, approved, typeof note === "string" ? note.slice(0, 500) : "")
        : false;
  if (!updated) {
    return NextResponse.json({ error: "This item is no longer waiting for review." }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
