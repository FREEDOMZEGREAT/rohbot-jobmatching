"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/lib/api/services/admin";
import { CheckCircle2, XCircle, Eye, FileText } from "lucide-react";

export default function AdminProfileApprovalsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // In production: call adminService.getDetailedProfiles()
    const mock = [
      { id: "P-001", name: "Abebe Kebede", category: "Registered Nurse", email: "abebe@example.com", phone: "+251911234567", documents: 4, submittedAt: "2024-12-01", status: "Pending" },
      { id: "P-002", name: "Sara Mohammed", category: "Midwife", email: "sara@example.com", phone: "+251922345678", documents: 4, submittedAt: "2024-12-02", status: "Pending" },
    ];
    setSubmissions(mock);
    setIsLoading(false);
  }, []);

  const handleApprove = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: "Approved" } : s));
    // In production: call API + trigger notification + email
    alert("Profile approved! Candidate notified via email and in-app notification.");
  };

  const handleReject = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: "Rejected" } : s));
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Approvals</h1>
          <p className="text-slate-500 text-sm mt-1">Review candidate profile details and documents before verification.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? <div className="p-12 text-center text-slate-500">Loading...</div> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Candidate</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Documents</th>
                  <th className="px-6 py-3 font-medium">Submitted</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.category}</td>
                    <td className="px-6 py-4"><span className="text-xs bg-slate-100 px-2 py-1 rounded flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> {s.documents} files</span></td>
                    <td className="px-6 py-4 text-slate-500">{s.submittedAt}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                        s.status === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.status === "Pending" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => handleApprove(s.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleReject(s.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}