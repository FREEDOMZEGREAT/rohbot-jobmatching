"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { trainingService, type TrainerInvitation } from "@/lib/api/services/training";
import { CheckCircle2, XCircle, Send, UserPlus } from "lucide-react";
import Link from "next/link";

export default function AdminTrainingPage() {
  const [trainers, setTrainers] = useState<TrainerInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  const fetchTrainers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage("");
    try {
      setTrainers(await trainingService.getAllTrainers());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load trainers.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    trainingService.getAllTrainers()
      .then((data) => {
        if (active) setTrainers(data);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Could not load trainers.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleComplete = async (id: string) => {
    setProcessingId(id);
    setErrorMessage("");
    setNotice("");
    try {
      const result = await trainingService.markTrainingComplete(id);
      setInvitationLink(result.invitationLink);
      setNotice(result.message);
      await fetchTrainers(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not complete this trainer's training.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Training Management</h1>
            <p className="text-slate-500 text-sm mt-1">Review trainer email verification and completion status.</p>
          </div>
          <Link href="/admin/training/register">
            <Button className="gap-2"><UserPlus className="w-4 h-4" /> Manage Registration QR</Button>
          </Link>
        </div>

        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Local demo only. Trainer records and simulated email links are held in server memory and reset when the server restarts.
        </div>

        {(errorMessage || notice) && (
          <p role={errorMessage ? "alert" : "status"} className={`text-sm ${errorMessage ? "text-red-700" : "text-emerald-700"}`}>
            {errorMessage || notice}
          </p>
        )}

        {invitationLink && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-sm font-medium text-emerald-900 mb-2">Candidate invitation email added to the demo inbox.</p>
            <p className="text-xs text-emerald-700 break-all font-mono bg-white p-2 rounded border">{invitationLink}</p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? <div className="p-12 text-center text-slate-500">Loading trainers...</div> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Full name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Email verified</th>
                  <th className="px-6 py-3 font-medium">Training</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{trainer.fullName}</td>
                    <td className="px-6 py-4 text-slate-600">{trainer.email}</td>
                    <td className="px-6 py-4">
                      {trainer.emailVerified
                        ? <span className="text-emerald-600 flex items-center gap-1 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                        : <span className="text-amber-600 flex items-center gap-1 text-xs font-medium"><XCircle className="w-3 h-3" /> Unverified</span>}
                    </td>
                    <td className="px-6 py-4">
                      {trainer.trainingCompleted
                        ? <span className="text-emerald-700 text-xs font-medium">{trainer.profileCreated ? "Candidate account created" : "Completed"}</span>
                        : <span className="text-slate-400 text-xs">In progress</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trainer.emailVerified && !trainer.trainingCompleted && (
                        <Button size="sm" onClick={() => handleComplete(trainer.id)} isLoading={processingId === trainer.id}>
                          <Send className="w-3 h-3 mr-1" /> Mark completed
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {trainers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No trainers registered yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
