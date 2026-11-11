"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { trainingService } from "@/lib/api/services/training";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function VerifyTrainerEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState(token ? "" : "This verification link is invalid or expired.");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");

  useEffect(() => {
    let active = true;
    if (!token) return () => { active = false; };
    trainingService.verifyTrainerEmail(token)
      .then((result) => {
        if (!active) return;
        setMessage(result.message);
        setStatus(result.success ? "success" : "error");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "This verification link is invalid or expired.");
        setStatus("error");
      });
    return () => { active = false; };
  }, [token]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${status === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
          {status === "success" ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{status === "success" ? "Email verified" : "Verification failed"}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {status === "success" && (
          <Link href="/trainer/scan" className="mt-6 inline-flex w-full">
            <Button className="w-full">Continue</Button>
          </Link>
        )}
      </div>
    </main>
  );
}

export default function VerifyTrainerEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><VerifyTrainerEmail /></Suspense>;
}
