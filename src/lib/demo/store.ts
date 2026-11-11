import { randomUUID } from "node:crypto";

export type DemoRole = "candidate" | "employer" | "admin";
export type AccountStatus =
  | "Awaiting email verification"
  | "Pending admin approval"
  | "Pending payment"
  | "Payment submitted"
  | "Approved"
  | "Rejected";
export type EmployerPaymentStatus = "Pending" | "Approved" | "Rejected";

export interface DemoCandidateAccount {
  id: string;
  firstName: string;
  secondName: string;
  email: string;
  phone: string;
  passwordSalt: string;
  passwordHash: string;
  invitationId: string;
  emailVerified: boolean;
  status: AccountStatus;
  createdAt: string;
}

export interface DemoEmployerAccount {
  id: string;
  organizationName: string;
  organizationType: string;
  city: string;
  subcity: string;
  hrEmail: string;
  organizationPhone: string;
  representativeEmail: string;
  representativePhone: string;
  businessLicenseFileName: string;
  businessLicenseDataUrl: string;
  passwordSalt: string;
  passwordHash: string;
  emailVerified: boolean;
  status: AccountStatus;
  createdAt: string;
  selectedPackage?: "Basic" | "Silver" | "Gold";
  payment?: {
    method: string;
    transactionId: string;
    proofFileName: string;
    proofDataUrl: string;
    submittedAt: string;
    status: EmployerPaymentStatus;
    reviewNote?: string;
  };
}

export interface DemoInvitation {
  id: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
}

export interface DemoOtp {
  id: string;
  role: "candidate" | "employer";
  accountId: string;
  email: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
  attempts: number;
}

export interface DemoSession {
  id: string;
  role: "candidate" | "employer";
  accountId: string;
}

export interface DemoTrainer {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  trainingCompleted: boolean;
  invitationSent: boolean;
  profileCreated: boolean;
  registeredAt: string;
  verificationTokenHash?: string;
  verificationExpiresAt?: string;
  invitationTokenHash?: string;
  invitationExpiresAt?: string;
}

export interface DemoTrainingEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  link: string;
  type: "email_verification" | "training_invitation";
  sentAt: string;
  opened: boolean;
}

export interface DemoStore {
  invitations: Map<string, DemoInvitation>;
  candidates: Map<string, DemoCandidateAccount>;
  employers: Map<string, DemoEmployerAccount>;
  otps: Map<string, DemoOtp>;
  sessions: Map<string, DemoSession>;
  trainers: Map<string, DemoTrainer>;
  trainingEmails: Map<string, DemoTrainingEmail>;
  trainingQrActive: boolean;
  trainingQrExpiresAt: string | null;
}

const globalDemoStore = globalThis as typeof globalThis & {
  rohobotDemoWorkflowStore?: DemoStore;
};

export const demoStore =
  globalDemoStore.rohobotDemoWorkflowStore ??
  (globalDemoStore.rohobotDemoWorkflowStore = {
    invitations: new Map(),
    candidates: new Map(),
    employers: new Map(),
    otps: new Map(),
    sessions: new Map(),
    trainers: new Map(),
    trainingEmails: new Map(),
    trainingQrActive: false,
    trainingQrExpiresAt: null,
  });

demoStore.trainers ??= new Map();
demoStore.trainingEmails ??= new Map();
demoStore.trainingQrActive ??= false;
demoStore.trainingQrExpiresAt ??= null;

export function newDemoId(): string {
  return randomUUID();
}

export function normalizeDemoEmail(email: string): string {
  return email.trim().toLowerCase();
}
