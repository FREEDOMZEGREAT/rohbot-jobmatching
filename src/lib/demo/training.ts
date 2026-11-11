import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { networkInterfaces } from "node:os";
import {
  isDemoAccountEmailRegistered,
  registerDemoTrainerCandidate,
} from "./invitations";
import {
  demoStore,
  normalizeDemoEmail,
  type DemoTrainer,
  type DemoTrainingEmail,
} from "./store";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function isPrivateIPv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function getPrivateNetworkIPv4(): string | undefined {
  for (const addresses of Object.values(networkInterfaces())) {
    const address = addresses?.find(
      (item) => item.family === "IPv4" && !item.internal && isPrivateIPv4(item.address)
    );
    if (address) return address.address;
  }
  return undefined;
}

type PublicDemoTrainer = Pick<
  DemoTrainer,
  "id" | "fullName" | "email" | "emailVerified" | "trainingCompleted" | "invitationSent" | "profileCreated" | "registeredAt"
>;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function matchesToken(expectedHash: string | undefined, token: string): boolean {
  if (!expectedHash) return false;
  const actualHash = hashToken(token);
  return timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(actualHash, "hex"));
}

function addTrainingEmail(
  trainer: DemoTrainer,
  type: DemoTrainingEmail["type"],
  url: string
): void {
  const verification = type === "email_verification";
  const id = `TRAINER-${randomUUID()}`;
  demoStore.trainingEmails.set(id, {
    id,
    to: trainer.email,
    subject: verification
      ? "Verify your Rohobot training registration"
      : "Your training is complete — create your candidate account",
    body: verification
      ? `Hello ${trainer.fullName},\n\nVerify your email address to confirm your training registration:\n${url}\n\nThis link expires in 24 hours.`
      : `Congratulations ${trainer.fullName}!\n\nYour training has been marked complete. Create your Rohobot candidate account:\n${url}\n\nThis link expires in 7 days.`,
    link: url,
    type,
    sentAt: new Date().toLocaleString(),
    opened: false,
  });
}

export function getTrainerQrSettings() {
  const expiresAt = demoStore.trainingQrExpiresAt;
  const active = demoStore.trainingQrActive && !!expiresAt && Date.parse(expiresAt) > Date.now();
  return { active, expiresAt };
}

export function getTrainerPublicOrigin(origin: string): string {
  const publicOrigin = new URL(origin);
  if (["localhost", "127.0.0.1", "::1", "0.0.0.0", "::"].includes(publicOrigin.hostname)) {
    const networkAddress = getPrivateNetworkIPv4();
    if (networkAddress) publicOrigin.hostname = networkAddress;
  }
  return publicOrigin.origin;
}

export function getTrainerRegistrationUrl(origin: string): string {
  return new URL("/trainer/scan", getTrainerPublicOrigin(origin)).toString();
}

export function setTrainerQrSettings(active: boolean, expiresAt: string | null) {
  if (active && (!expiresAt || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) {
    return { success: false, message: "Choose a QR expiration time in the future." };
  }
  demoStore.trainingQrActive = active;
  demoStore.trainingQrExpiresAt = active ? expiresAt : null;
  return { success: true, settings: getTrainerQrSettings() };
}

export function listDemoTrainers(): PublicDemoTrainer[] {
  return [...demoStore.trainers.values()]
    .map(({ id, fullName, email, emailVerified, trainingCompleted, invitationSent, profileCreated, registeredAt }) => ({
      id,
      fullName,
      email,
      emailVerified,
      trainingCompleted,
      invitationSent,
      profileCreated,
      registeredAt,
    }))
    .sort((left, right) => right.registeredAt.localeCompare(left.registeredAt));
}

export function registerDemoTrainer(
  fullNameInput: string,
  emailInput: string,
  origin: string
): { success: boolean; message: string; verificationLink?: string } {
  if (!getTrainerQrSettings().active) {
    return { success: false, message: "Trainer registration is currently closed." };
  }
  const fullName = fullNameInput.trim().replace(/\s+/g, " ");
  const email = normalizeDemoEmail(emailInput);
  if (fullName.length < 2 || fullName.length > 120 || !EMAIL_PATTERN.test(email) || email.length > 254) {
    return { success: false, message: "Enter your full name and a valid email address." };
  }
  if (
    [...demoStore.trainers.values()].some((trainer) => normalizeDemoEmail(trainer.email) === email) ||
    isDemoAccountEmailRegistered(email)
  ) {
    return { success: false, message: "This email address is already registered." };
  }

  const token = randomBytes(32).toString("base64url");
  const trainer: DemoTrainer = {
    id: randomUUID(),
    fullName,
    email,
    emailVerified: false,
    trainingCompleted: false,
    invitationSent: false,
    profileCreated: false,
    registeredAt: new Date().toISOString(),
    verificationTokenHash: hashToken(token),
    verificationExpiresAt: new Date(Date.now() + VERIFICATION_LIFETIME_MS).toISOString(),
  };
  demoStore.trainers.set(trainer.id, trainer);
  const verificationLink = `${origin}/trainer/verify?token=${encodeURIComponent(token)}`;
  addTrainingEmail(trainer, "email_verification", verificationLink);
  return {
    success: true,
    message: "Registration saved. Email is simulated in this local demo; use the test verification link below.",
    verificationLink,
  };
}

export function verifyDemoTrainerEmail(token: string): { success: boolean; message: string } {
  const trainer = [...demoStore.trainers.values()].find((item) =>
    matchesToken(item.verificationTokenHash, token)
  );
  if (!trainer || !trainer.verificationExpiresAt || Date.parse(trainer.verificationExpiresAt) <= Date.now()) {
    return { success: false, message: "This verification link is invalid or expired." };
  }
  trainer.emailVerified = true;
  delete trainer.verificationTokenHash;
  delete trainer.verificationExpiresAt;
  return { success: true, message: "Your email is verified. The admin can now track your training." };
}

export function completeDemoTrainerTraining(
  trainerId: string,
  origin: string
): { success: boolean; message: string; invitationLink?: string } {
  const trainer = demoStore.trainers.get(trainerId);
  if (!trainer) return { success: false, message: "Trainer not found." };
  if (!trainer.emailVerified) return { success: false, message: "Verify the trainer's email before completion." };
  if (trainer.trainingCompleted || trainer.invitationSent) {
    return { success: false, message: "Training has already been completed." };
  }

  const token = randomBytes(32).toString("base64url");
  trainer.trainingCompleted = true;
  trainer.invitationSent = true;
  trainer.invitationTokenHash = hashToken(token);
  trainer.invitationExpiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS).toISOString();
  const invitationLink = `${origin}/candidate/register?token=${encodeURIComponent(token)}`;
  addTrainingEmail(trainer, "training_invitation", invitationLink);
  return { success: true, message: "Training completed. The candidate invitation email was sent.", invitationLink };
}

export function inspectDemoTrainerInvitation(token: string) {
  const trainer = [...demoStore.trainers.values()].find((item) =>
    matchesToken(item.invitationTokenHash, token)
  );
  if (
    !trainer ||
    !trainer.invitationExpiresAt ||
    Date.parse(trainer.invitationExpiresAt) <= Date.now() ||
    trainer.profileCreated
  ) {
    return { valid: false, message: "This invitation link is invalid, expired, or already used." };
  }
  return { valid: true, fullName: trainer.fullName, email: trainer.email };
}

export function registerDemoTrainerCandidateAccount(
  token: string,
  phone: string,
  password: string
): { success: boolean; message: string } {
  const trainer = [...demoStore.trainers.values()].find((item) =>
    matchesToken(item.invitationTokenHash, token)
  );
  if (
    !trainer ||
    !trainer.trainingCompleted ||
    !trainer.emailVerified ||
    !trainer.invitationExpiresAt ||
    Date.parse(trainer.invitationExpiresAt) <= Date.now() ||
    trainer.profileCreated
  ) {
    return { success: false, message: "This invitation link is invalid, expired, or already used." };
  }
  const result = registerDemoTrainerCandidate({
    trainerId: trainer.id,
    fullName: trainer.fullName,
    email: trainer.email,
    phone,
    password,
  });
  if (result.success) {
    trainer.profileCreated = true;
    delete trainer.invitationTokenHash;
    delete trainer.invitationExpiresAt;
  }
  return result;
}

export function listDemoTrainingEmails(): DemoTrainingEmail[] {
  return [...demoStore.trainingEmails.values()].sort((left, right) => right.sentAt.localeCompare(left.sentAt));
}

export function markDemoTrainingEmailOpened(id: string): boolean {
  const mail = demoStore.trainingEmails.get(id);
  if (!mail) return false;
  mail.opened = true;
  return true;
}

export function clearDemoTrainingEmails(): void {
  demoStore.trainingEmails.clear();
}
