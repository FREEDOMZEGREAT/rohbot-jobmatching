import { NextRequest, NextResponse } from "next/server";
import { verifyDemoTrainerEmail } from "@/lib/demo/training";
import { isLocalDemoRequest } from "@/lib/demo/request-guards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isLocalDemoRequest(request)) {
    return NextResponse.json({ error: "Trainer verification is unavailable." }, { status: 404 });
  }
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token.length > 200) {
    return NextResponse.json({ success: false, message: "This verification link is invalid or expired." }, { status: 400 });
  }
  const result = verifyDemoTrainerEmail(token);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
