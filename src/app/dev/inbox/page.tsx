"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { mailerService, SentMail } from "@/lib/api/services/mailer";
import { Inbox, Mail, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DevInboxPage() {
  const [mails, setMails] = useState<SentMail[]>([]);
  const [selected, setSelected] = useState<SentMail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/demo/training/inbox", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { emails?: SentMail[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load trainer emails.");
        return result.emails ?? [];
      })
      .then((trainerMails) => {
        if (!active) return;
        setMails([...trainerMails, ...mailerService.getAll()]);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMails(mailerService.getAll());
        setErrorMessage(error instanceof Error ? error.message : "Could not load trainer emails.");
      });
    return () => { active = false; };
  }, [refreshKey]);

  const handleOpen = async (mail: SentMail) => {
    if (mail.id.startsWith("TRAINER-")) {
      try {
        await fetch("/api/demo/training/inbox", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: mail.id }),
        });
      } catch {
        setErrorMessage("Could not mark the trainer email as opened.");
      }
    } else {
      mailerService.markOpened(mail.id);
    }
    setSelected({ ...mail, opened: true });
    setRefreshKey(k => k + 1);
  };

  const handleClear = async () => {
    mailerService.clear();
    setSelected(null);
    try {
      const response = await fetch("/api/demo/training/inbox", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not clear trainer emails.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not clear trainer emails.");
    }
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">Rohobot Dev Inbox</span>
          <span className="text-xs text-slate-400 ml-2">(Simulated mail — for testing only)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="bg-transparent text-white border-slate-700 hover:bg-slate-800">
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Link href="/">
            <Button size="sm" variant="outline" className="bg-transparent text-white border-slate-700 hover:bg-slate-800">Back to App</Button>
          </Link>
        </div>
      </div>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Mail list */}
        <div className="w-96 bg-white border-r border-slate-200 overflow-y-auto">
          {errorMessage && <p role="alert" className="m-4 text-sm text-red-700">{errorMessage}</p>}
          {mails.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No emails yet. Trigger an action to see emails here.</p>
            </div>
          ) : (
            mails.map((mail) => (
              <button
                key={mail.id}
                onClick={() => handleOpen(mail)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selected?.id === mail.id ? "bg-primary-50 border-l-4 border-l-primary-600" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!mail.opened ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{mail.subject}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">To: {mail.to}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{mail.sentAt}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    mail.type === "email_verification" ? "bg-amber-100 text-amber-700" :
                    mail.type === "training_invitation" ? "bg-blue-100 text-blue-700" :
                    mail.type === "profile_approved" ? "bg-emerald-100 text-emerald-700" :
                    "bg-red-100 text-red-700"
                  }`}>{mail.type}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Mail body */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selected ? (
            <div className="max-w-2xl mx-auto p-8">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-xs text-slate-500">Opened</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{selected.subject}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-200">
                <span><strong className="text-slate-700">To:</strong> {selected.to}</span>
                <span><strong className="text-slate-700">Sent:</strong> {selected.sentAt}</span>
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
              
              {selected.link && (
                <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-xs font-semibold text-primary-900 mb-2">🔗 Action Link (click to test):</p>
                  <Link href={selected.link.replace(/^https?:\/\/[^/]+/, "")}>
                    <Button className="w-full gap-2"><ExternalLink className="w-4 h-4" /> Open Link</Button>
                  </Link>
                  <p className="text-[10px] text-primary-700 mt-2 break-all font-mono">{selected.link}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p>Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}