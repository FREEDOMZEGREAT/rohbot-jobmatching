import { NextRequest, NextResponse } from "next/server";
import {
  inspectDemoInvitation,
  registerDemoCandidate,
  type CandidateRegistrationInput,
} from "@/lib/demo/invitations";
import { isLocalDemoRequest } from "@/lib/demo/request-guards";

export const runtime = "nodejs";

function isCandidateRegistrationInput(value: unknown): value is CandidateRegistrationInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "firstName" in value &&
    typeof value.firstName === "string" &&
    "secondName" in value &&
    typeof value.secondName === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "phone" in value &&
    typeof value.phone === "string" &&
    "password" in value &&
    typeof value.password === "string"
  );
}

export async function POST(request: NextRequest) {
  if (!isLocalDemoRequest(request)) {
    return NextResponse.json({ error: "Demo registration is unavailable." }, { status: 404 });
  }

  let action: unknown;
  let token: unknown;
  let registration: unknown;
  try {
    ({ action, token, registration } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid invitation request." }, { status: 400 });
  }

  if (typeof token !== "string" || token.length > 200) {
    return NextResponse.json({ error: "This invitation link is invalid." }, { status: 400 });
  }

  if (action === "inspect") {
    return NextResponse.json(inspectDemoInvitation(token));
  }

  if (action === "register") {
    if (!isCandidateRegistrationInput(registration)) {
      return NextResponse.json({ error: "Complete all candidate registration fields." }, { status: 400 });
    }

    const result = registerDemoCandidate(token, registration);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  }

  return NextResponse.json({ error: "Invalid invitation action." }, { status: 400 });
}
