import { NextRequest, NextResponse } from "next/server";
import {
  completeDemoTrainerTraining,
  getTrainerPublicOrigin,
  getTrainerRegistrationUrl,
  getTrainerQrSettings,
  inspectDemoTrainerInvitation,
  listDemoTrainers,
  registerDemoTrainer,
  registerDemoTrainerCandidateAccount,
  setTrainerQrSettings,
} from "@/lib/demo/training";
import {
  getDemoRequestOrigin,
  isLocalDemoAdmin,
  isLocalDemoRequest,
} from "@/lib/demo/request-guards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isLocalDemoRequest(request)) {
    return NextResponse.json({ error: "Trainer registration is unavailable." }, { status: 404 });
  }
  if (request.nextUrl.searchParams.get("view") === "scan") {
    return NextResponse.json({
      ...getTrainerQrSettings(),
      registrationUrl: getTrainerRegistrationUrl(getDemoRequestOrigin(request)),
    });
  }
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  return NextResponse.json({ settings: getTrainerQrSettings(), trainers: listDemoTrainers() });
}

export async function PATCH(request: NextRequest) {
  if (!isLocalDemoAdmin(request)) {
    return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
  }
  let active: unknown;
  let expiresAt: unknown;
  try {
    ({ active, expiresAt } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid QR settings." }, { status: 400 });
  }
  if (typeof active !== "boolean" || (expiresAt !== null && typeof expiresAt !== "string")) {
    return NextResponse.json({ error: "Choose whether the QR is active and set its expiration time." }, { status: 400 });
  }
  const result = setTrainerQrSettings(active, expiresAt);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(request: NextRequest) {
  if (!isLocalDemoRequest(request)) {
    return NextResponse.json({ error: "Trainer registration is unavailable." }, { status: 404 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid trainer request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid trainer request." }, { status: 400 });
  }

  if (body.action === "register") {
    if (typeof body.fullName !== "string" || typeof body.email !== "string") {
      return NextResponse.json({ error: "Enter your full name and email address." }, { status: 400 });
    }
    const origin = getTrainerPublicOrigin(getDemoRequestOrigin(request));
    const result = registerDemoTrainer(body.fullName, body.email, origin);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  }

  if (body.action === "complete") {
    if (!isLocalDemoAdmin(request)) {
      return NextResponse.json({ error: "Admin demo access is required." }, { status: 403 });
    }
    if (typeof body.trainerId !== "string") {
      return NextResponse.json({ error: "Choose a trainer to complete." }, { status: 400 });
    }
    const origin = getTrainerPublicOrigin(getDemoRequestOrigin(request));
    const result = completeDemoTrainerTraining(body.trainerId, origin);
    return NextResponse.json(result, { status: result.success ? 200 : 409 });
  }

  if (body.action === "inspect" || body.action === "signup") {
    if (typeof body.token !== "string" || body.token.length > 200) {
      return NextResponse.json({ error: "This invitation link is invalid." }, { status: 400 });
    }
    if (body.action === "inspect") {
      return NextResponse.json(inspectDemoTrainerInvitation(body.token));
    }
    if (typeof body.phone !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Enter your phone number and password." }, { status: 400 });
    }
    const result = registerDemoTrainerCandidateAccount(body.token, body.phone, body.password);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  }

  return NextResponse.json({ error: "Invalid trainer action." }, { status: 400 });
}
