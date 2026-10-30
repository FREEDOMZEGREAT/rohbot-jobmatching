"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/layout/SignOutButton";

const PACKAGES = [
  { name: "Basic", amount: 500, detail: "For smaller recruitment needs" },
  { name: "Silver", amount: 1500, detail: "For growing healthcare teams" },
  { name: "Gold", amount: 3000, detail: "For high-volume recruitment" },
] as const;

interface EmployerAccount {
  organizationName: string;
  status: string;
  packageName?: (typeof PACKAGES)[number]["name"];
  paymentStatus?: string;
  reviewNote?: string;
}

export default function EmployerPackagesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<EmployerAccount | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<(typeof PACKAGES)[number]["name"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/demo/employer/activation", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { account?: EmployerAccount; error?: string };
        if (!response.ok || !result.account) throw new Error(result.error ?? "Could not load employer account.");
        if (active) {
          setAccount(result.account);
          setSelectedPackage(result.account.packageName ?? null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Could not load employer package options.", error);
          setErrorMessage(error instanceof Error ? error.message : "Could not load employer account.");
        }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const continueToPayment = async () => {
    if (!selectedPackage) {
      setErrorMessage("Choose a package to continue.");
      return;
    }
    setIsSelecting(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/demo/employer/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName: selectedPackage }),
      });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok || !result.success) throw new Error(result.message ?? result.error ?? "Could not select package.");
      router.push("/employer/payment");
    } catch (error) {
      console.error("Could not select employer package.", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not select package.");
      setIsSelecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><Building2 className="h-6 w-6" /></span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Employer subscription</p>
            <h1 className="text-2xl font-bold text-slate-900">Choose a package</h1>
            {account && <p className="text-sm text-slate-600">{account.organizationName}</p>}
          </div>
        </header>

        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Choose one package to continue to the payment form. Your employer features stay locked until an admin approves your payment submission.
        </div>
        {account?.paymentStatus === "Rejected" && (
          <p role="status" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Your previous payment proof was not approved{account.reviewNote ? `: ${account.reviewNote}` : "."} Select a package and submit new proof.
          </p>
        )}
        {errorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</p>}

        {isLoading ? <p className="py-8 text-sm text-slate-600">Loading packages...</p> : (
          <>
            <section className="grid gap-4 md:grid-cols-3" aria-label="Available packages">
              {PACKAGES.map((item) => (
                <label key={item.name} className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${selectedPackage === item.name ? "border-primary-600 ring-2 ring-primary-100" : "border-slate-200"}`}>
                  <input
                    type="radio"
                    name="package"
                    value={item.name}
                    checked={selectedPackage === item.name}
                    onChange={() => setSelectedPackage(item.name)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <span className="text-lg font-bold text-slate-900">{item.name}</span>
                    {selectedPackage === item.name && <CheckCircle2 className="h-5 w-5 text-primary-700" aria-label="Selected" />}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-primary-800">{item.amount.toLocaleString()} ETB</p>
                  <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                </label>
              ))}
            </section>
            <Button type="button" className="w-full sm:w-auto" disabled={!selectedPackage || isSelecting} isLoading={isSelecting} onClick={continueToPayment}>
              Continue to payment
            </Button>
          </>
        )}
        <div className="flex justify-end"><SignOutButton /></div>
      </div>
    </main>
  );
}
