export interface TrainerInvitation {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  trainingCompleted: boolean;
  invitationSent: boolean;
  profileCreated: boolean;
  registeredAt: string;
}

export interface TrainerQrSettings {
  active: boolean;
  expiresAt: string | null;
}

export interface TrainerQrDisplaySettings extends TrainerQrSettings {
  registrationUrl: string;
}

export interface TrainerInvitationDetails {
  fullName: string;
  email: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const result = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(result.message ?? result.error ?? "The trainer request failed.");
  }
  return result;
}

export const trainingService = {
  getQrSettings: async (): Promise<TrainerQrDisplaySettings> =>
    request<TrainerQrDisplaySettings>("/api/demo/training?view=scan"),

  saveQrSettings: async (settings: TrainerQrSettings): Promise<TrainerQrSettings> => {
    const result = await request<{ success: boolean; settings?: TrainerQrSettings; message?: string }>(
      "/api/demo/training",
      { method: "PATCH", body: JSON.stringify(settings) }
    );
    if (!result.success || !result.settings) throw new Error(result.message ?? "Could not save QR settings.");
    return result.settings;
  },

  registerTrainerFromQR: (data: { fullName: string; email: string }) =>
    request<{ success: boolean; message: string; verificationLink?: string }>("/api/demo/training", {
      method: "POST",
      body: JSON.stringify({ action: "register", ...data }),
    }),

  verifyTrainerEmail: (token: string) =>
    request<{ success: boolean; message: string }>(
      `/api/demo/training/verify?token=${encodeURIComponent(token)}`
    ),

  getAllTrainers: async (): Promise<TrainerInvitation[]> => {
    const result = await request<{ trainers: TrainerInvitation[] }>("/api/demo/training");
    return result.trainers;
  },

  markTrainingComplete: (trainerId: string) =>
    request<{ success: boolean; message: string; invitationLink: string }>(
      "/api/demo/training",
      { method: "POST", body: JSON.stringify({ action: "complete", trainerId }) }
    ),

  getTrainerByToken: async (token: string): Promise<TrainerInvitationDetails | null> => {
    const result = await request<{ valid: boolean; fullName?: string; email?: string; message?: string }>(
      "/api/demo/training",
      { method: "POST", body: JSON.stringify({ action: "inspect", token }) }
    );
    if (!result.valid || !result.fullName || !result.email) return null;
    return { fullName: result.fullName, email: result.email };
  },

  completeSignup: (token: string, phone: string, password: string) =>
    request<{ success: boolean; message: string }>("/api/demo/training", {
      method: "POST",
      body: JSON.stringify({ action: "signup", token, phone, password }),
    }),
};
