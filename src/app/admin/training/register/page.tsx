"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { trainingService } from "@/lib/api/services/training";
import { QrCode, MailOpen, CheckCircle2, Printer } from "lucide-react";
import QRCode from "qrcode";
import Link from "next/link";

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function defaultExpiry(): string {
  return toLocalDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
}

export default function AdminRegisterTrainerPage() {
  const [isActive, setIsActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState(defaultExpiry);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    trainingService.getQrSettings()
      .then(async (settings) => {
        if (!active) return;
        setIsActive(settings.active);
        if (settings.expiresAt) setExpiresAt(toLocalDateTime(settings.expiresAt));
        setQrUrl(settings.registrationUrl);
        const dataUrl = await QRCode.toDataURL(settings.registrationUrl, { width: 256, margin: 2 });
        if (!active) return;
        setQrDataUrl(dataUrl);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Could not load QR settings.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const saveSettings = async (active: boolean) => {
    setIsSaving(true);
    setErrorMessage("");
    setNotice("");
    try {
      const settings = await trainingService.saveQrSettings({
        active,
        expiresAt: active ? new Date(expiresAt).toISOString() : null,
      });
      setIsActive(settings.active);
      setNotice(active ? "Trainer registration QR is active until the selected time." : "Trainer registration QR is off.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update QR settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trainer Registration QR</h1>
          <p className="text-slate-500 text-sm mt-1">Turn registration on or off and set when the QR should expire.</p>
        </div>

        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Local demo only. QR status and trainer data are held in server memory and reset when the server restarts.
        </div>
        <div role="note" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          To scan from a phone, open this admin page using your computer&apos;s local network IP address (not <code>localhost</code>), then activate and print the QR. Your phone must be on the same Wi-Fi network.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section id="trainer-registration-qr" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary-600" /> Registration QR
            </h2>
            {isLoading ? (
              <div className="w-64 h-64 bg-slate-100 rounded-lg animate-pulse" />
            ) : isActive && qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="Trainer registration QR code"
                width={256}
                height={256}
                unoptimized
                className="h-64 w-64 rounded-lg border-4 border-slate-100"
              />
            ) : (
              <div className="w-64 h-64 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-sm text-slate-500 text-center p-6">
                QR registration is off. Activate it to display the code.
              </div>
            )}
            {isActive && <p className="text-xs text-slate-600 mt-3">Expires {new Date(expiresAt).toLocaleString()}</p>}
            {isActive && <p className="mt-2 max-w-xs break-all text-center text-xs text-slate-500">{qrUrl}</p>}
            {isActive && qrDataUrl && (
              <Button
                type="button"
                variant="outline"
                className="no-print mt-4 gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Print QR code
              </Button>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">QR availability</h2>
            <label className="block text-sm font-medium text-slate-700">
              Registration closes at
              <input
                type="datetime-local"
                required
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={isLoading || isSaving}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => saveSettings(true)} isLoading={isSaving} disabled={isLoading || isSaving}>
                Turn QR on
              </Button>
              <Button type="button" variant="outline" onClick={() => saveSettings(false)} isLoading={isSaving} disabled={isLoading || isSaving || !isActive}>
                Turn QR off
              </Button>
            </div>
            {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
            {notice && <p role="status" className="text-sm text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{notice}</p>}
            <Link href="/dev/inbox" className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline">
              <MailOpen className="h-4 w-4" /> Open the simulated email inbox
            </Link>
          </section>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #trainer-registration-qr,
          #trainer-registration-qr * {
            visibility: visible !important;
          }
          #trainer-registration-qr {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          #trainer-registration-qr .no-print {
            display: none !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
