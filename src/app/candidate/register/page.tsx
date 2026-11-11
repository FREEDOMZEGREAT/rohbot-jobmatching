"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { trainingService, type TrainerInvitationDetails } from "@/lib/api/services/training";
import { Lock, AlertCircle } from "lucide-react";

function CandidateRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [prefill, setPrefill] = useState<TrainerInvitationDetails | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(token ? "" : "Invalid or missing invitation token.");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) return () => { active = false; };
    trainingService.getTrainerByToken(token)
      .then((data) => {
        if (!active) return;
        if (!data) setError("This invitation link is invalid, expired, or has already been used.");
        else setPrefill(data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not check this invitation.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (!token) return;
    setIsSubmitting(true);
    setError("");
    try {
      await trainingService.completeSignup(token, phone, password);
      router.replace("/login?role=candidate&registered=1");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Signup failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <DashboardLayout role="candidate"><div className="p-8 text-slate-500">Loading invitation...</div></DashboardLayout>;
  if (error && !prefill) return (
    <DashboardLayout role="candidate">
      <div className="max-w-md mx-auto mt-20 text-center bg-white border border-red-200 rounded-xl p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid invitation</h1>
        <p role="alert" className="text-slate-500">{error}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="candidate">
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your candidate account</h1>
          <p className="text-sm text-slate-500 mb-6">Your invitation is tied to your verified training registration.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> Full name</label>
              <input disabled value={prefill?.fullName ?? ""} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> Email</label>
              <input disabled value={prefill?.email ?? ""} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Phone number
              <input required type="tel" maxLength={30} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Confirm password
              <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div role="note" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Local demo only. Account records are held in server memory and reset when the server restarts.
            </div>
            <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Create candidate account</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CandidateRegisterPage() {
  return (
    <Suspense fallback={<DashboardLayout role="candidate"><div className="p-8 text-slate-500">Loading invitation...</div></DashboardLayout>}>
      <CandidateRegisterContent />
    </Suspense>
  );
}
