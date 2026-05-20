"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Download, Check } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { SEED_POLICIES, POLICY_DOCS, POLICY_CATEGORIES, type Policy } from "../_components/_data";

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-purple-50 text-brand-purple",
  Leave:   "bg-blue-50 text-blue-700",
  Conduct: "bg-amber-50 text-amber-700",
  Safety:  "bg-red-50 text-red-700",
  Finance: "bg-emerald-50 text-emerald-700",
  Travel:  "bg-slate-100 text-slate-700",
};

function downloadPolicy(policy: Policy) {
  const doc = POLICY_DOCS[policy.id];
  if (!doc) return;
  const body = doc.sections.map((s) => `${s.heading}\n\n${s.body}`).join("\n\n---\n\n");
  const text = `PORTLAND GAS OPERATIONS\n${"=".repeat(40)}\n\n${doc.title}\nVersion: ${policy.version} | Effective: ${policy.effectiveDate}\n\n${"=".repeat(40)}\n\n${body}\n\n---\nEnd of document.\n© Portland Gas Operations ${new Date().getFullYear()}`;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(SEED_POLICIES);
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("");
  const [viewing, setViewing] = useState<Policy | null>(null);

  const filtered = policies.filter((p) => {
    const match = `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase());
    const byCat = !catF || p.category === catF;
    return match && byCat;
  });

  const acknowledge = (id: number) => {
    setPolicies((p) =>
      p.map((pol) =>
        pol.id === id && pol.acknowledged < pol.total
          ? { ...pol, acknowledged: pol.acknowledged + 1 }
          : pol
      )
    );
  };

  // ── Policy detail view ────────────────────────────────────────────────────
  if (viewing) {
    const doc = POLICY_DOCS[viewing.id];
    return (
      <AppLayout pageTitle={doc?.title ?? "Policy"}>
        <button
          onClick={() => setViewing(null)}
          className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back to Policies
        </button>

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden max-w-4xl">
          <div className="h-1.5 w-full bg-linear-to-r from-brand-purple to-brand-purple-light" />
          <div className="p-6 lg:p-10">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-6 border-b border-brand-border">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[viewing.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {viewing.category}
                  </span>
                  <span className="text-xs text-brand-text-secondary">v{viewing.version}</span>
                </div>
                <h1 className="text-2xl font-bold text-brand-text-primary">{doc?.title}</h1>
                <p className="text-sm text-brand-text-secondary mt-1">
                  Effective: {viewing.effectiveDate} · Portland Gas Operations
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={() => downloadPolicy(viewing)} className="flex items-center gap-1.5 text-xs">
                  <Download size={13} /> Download
                </Button>
                <Button onClick={() => acknowledge(viewing.id)} className="flex items-center gap-1.5 text-xs">
                  <Check size={13} /> I Acknowledge
                </Button>
              </div>
            </div>

            {doc ? (
              <div className="space-y-8">
                {doc.sections.map((s, i) => (
                  <div key={i}>
                    <h2 className="text-base font-bold text-brand-text-primary mb-3">{s.heading}</h2>
                    <p className="text-sm text-brand-text-secondary leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-text-secondary text-sm">Policy content not available.</p>
            )}

            <div className="mt-10 pt-6 border-t border-brand-border text-center text-xs text-brand-text-secondary">
              Portland Gas Operations · Confidential · {doc?.title} · v{viewing.version}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="HR Policies">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>

      <PageHeader
        title="HR Policies"
        description="Company policy library — view, download, and acknowledge"
        className="mb-6"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            className="w-full rounded-xl border border-brand-border bg-brand-card px-4 py-2.5 pl-9 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple-mid focus:border-brand-purple transition"
            placeholder="Search policies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <select
          className="rounded-xl border border-brand-border bg-brand-card px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple-mid transition w-full sm:w-48 appearance-none"
          value={catF}
          onChange={(e) => setCatF(e.target.value)}
        >
          <option value="">All Categories</option>
          {POLICY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const pct = Math.round((p.acknowledged / p.total) * 100);
          return (
            <div
              key={p.id}
              className="bg-brand-card border border-brand-border rounded-2xl p-5 hover:shadow-md hover:border-brand-purple-mid transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[p.category] ?? "bg-gray-100 text-gray-600"}`}>
                  {p.category}
                </span>
                <span className="text-xs text-brand-text-secondary">v{p.version}</span>
              </div>
              <h3 className="font-bold text-brand-text-primary mb-1">{p.name}</h3>
              <p className="text-xs text-brand-text-secondary mb-4">Effective: {p.effectiveDate}</p>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-brand-text-secondary mb-1">
                  <span>Acknowledged</span>
                  <span>{p.acknowledged}/{p.total} ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct === 100 ? "#059669" : "#7c3aed",
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => setViewing(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-brand-purple text-white hover:opacity-90 transition"
                >
                  <Eye size={12} /> View
                </button>
                <button
                  onClick={() => downloadPolicy(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-brand-text-secondary hover:bg-gray-200 transition"
                >
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={() => acknowledge(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                >
                  <Check size={12} /> Acknowledge
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-brand-text-secondary text-sm">
            No policies found
          </div>
        )}
      </div>
    </AppLayout>
  );
}
