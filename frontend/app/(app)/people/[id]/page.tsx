"use client";

import { use } from "react";
import Link from "next/link";
import {
  ChevronLeft, Mail, Phone, Briefcase, Building2,
  Users, Cake, CalendarDays, Hash,
} from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import Avatar from "@/components/ui/Avatar";
import { useEmployee } from "@/lib/modules/employees/hooks";

// ── Employment type colours ───────────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  "Full-time": { bg: "#DCFCE7", text: "#166534" },
  "Part-time": { bg: "#FEF9C3", text: "#854D0E" },
  "Contract":  { bg: "#F3EEFF", text: "#7234BD" },
  "Intern":    { bg: "#FEE2E2", text: "#991B1B" },
};

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: emp, isLoading, error } = useEmployee(id);

  const fullName    = emp ? `${emp.user?.first_name ?? ""} ${emp.user?.last_name ?? ""}`.trim() : "";
  const initials    = fullName.trim().split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const managerName = emp?.operating_manager?.user
    ? `${emp.operating_manager.user.first_name ?? ""} ${emp.operating_manager.user.last_name ?? ""}`.trim()
    : null;
  const managerTitle = emp?.operating_manager?.job_title ?? null;
  const birthday  = emp?.birthday
    ? new Date(emp.birthday + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    : null;
  const hireDate  = emp?.hire_date
    ? new Date(emp.hire_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const typeStyle = emp?.employment_type ? (TYPE_STYLE[emp.employment_type] ?? { bg: "#F3F4F6", text: "#6B7280" }) : null;

  return (
    <IntranetLayout>

      {/* ── Animated hero ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pg-blob  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-14px) scale(1.06)} 66%{transform:translate(-12px,8px) scale(0.96)} }
        @keyframes pg-blob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-20px,12px) scale(1.08)} 70%{transform:translate(14px,-8px) scale(0.94)} }
        @keyframes pg-scan  { 0%{transform:translateY(-100%);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(500%);opacity:0} }
        @keyframes pg-rise  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <section className="relative bg-[#1C043B] overflow-hidden" style={{ minHeight: 300 }}>

        {/* Blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor:"#7234BD", opacity:0.35, animation:"pg-blob 9s ease-in-out infinite" }} />
        <div className="absolute -bottom-10 left-[25%] w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor:"#FFBC00", opacity:0.09, animation:"pg-blob2 12s ease-in-out infinite" }} />
        <div className="absolute top-1/2 right-[15%] w-56 h-56 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor:"#7234BD", opacity:0.18, animation:"pg-blob 14s ease-in-out infinite reverse" }} />

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{ opacity:0.06 }}>
          <defs><pattern id="pgd" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="white"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#pgd)" />
        </svg>

        {/* Gold scan line */}
        <div className="absolute left-0 right-0 h-px pointer-events-none" style={{ background:"linear-gradient(90deg,transparent 0%,rgba(255,188,0,0.5) 40%,rgba(255,188,0,0.8) 50%,rgba(255,188,0,0.5) 60%,transparent 100%)", animation:"pg-scan 7s ease-in-out infinite", animationDelay:"0.8s" }} />

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 pb-10 relative z-10">
          <Link href="/people" className="inline-flex items-center gap-1.5 text-white/35 hover:text-[#FFBC00] text-xs font-semibold mb-10 transition-colors">
            <ChevronLeft size={13} />
            Employee Directory
          </Link>

          {isLoading ? (
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 animate-pulse">
              <div className="w-28 h-28 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-8 w-64 rounded-full bg-white/10" />
                <div className="h-4 w-40 rounded-full bg-white/10" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-20 rounded-full bg-white/10" />
                  <div className="h-6 w-28 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ) : error || !emp ? (
            <p className="text-white/50 text-sm py-8">Employee not found.</p>
          ) : (
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8" style={{ animation:"pg-rise 0.5s ease both" }}>

              {/* Avatar — large with layered rings */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full opacity-30 blur-xl scale-110" style={{ backgroundColor:"#7234BD" }} />
                <div className="relative">
                  {emp.user?.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={emp.user.profile_picture_url}
                      alt={fullName}
                      className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20 ring-offset-4 ring-offset-[#1C043B]"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#7234BD] ring-4 ring-white/20 ring-offset-4 ring-offset-[#1C043B] flex items-center justify-center text-3xl font-extrabold text-white">
                      {initials || "?"}
                    </div>
                  )}
                  {/* Online dot */}
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 ring-2 ring-[#1C043B]" />
                </div>
              </div>

              {/* Name block */}
              <div className="flex-1">
                {emp.department && (
                  <p className="text-[#FFBC00] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2">{emp.department}</p>
                )}
                <h1 className="text-4xl font-extrabold text-white leading-tight mb-1">{fullName}</h1>
                <p className="text-white/50 text-base mb-4">{emp.job_title ?? "—"}</p>

                <div className="flex flex-wrap items-center gap-2">
                  {typeStyle && emp.employment_type && (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}>
                      {emp.employment_type}
                    </span>
                  )}
                  {emp.employee_no && (
                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/10 text-white/50 border border-white/10">
                      {emp.employee_no}
                    </span>
                  )}
                </div>
              </div>

              {/* Right — quick contact pill */}
              {emp.user?.email && (
                <a
                  href={`mailto:${emp.user.email}`}
                  className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-[#FFBC00] hover:text-[#1C043B] border border-white/15 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200"
                >
                  <Mail size={14} />
                  Send Email
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Info section ──────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
            {[5, 4, 2].map((rows, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="h-3 w-20 rounded-full bg-gray-200" />
                {Array.from({ length: rows }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-2 w-16 rounded-full bg-gray-100" />
                      <div className="h-3.5 w-full rounded-full bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && emp && (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">

          {/* 3-column grid — all cards in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7234BD, #FFBC00)" }} />
              <div className="p-6">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7234BD] mb-5">Contact</p>
                <div className="space-y-4">
                  <InfoItem icon={Mail}  label="Work Email" value={emp.user?.email} href={emp.user?.email ? `mailto:${emp.user.email}` : undefined} />
                  <InfoItem icon={Phone} label="Phone"      value={emp.phone}       href={emp.phone ? `tel:${emp.phone}` : undefined} />
                </div>
              </div>
            </div>

            {/* Employment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #FFBC00, #7234BD)" }} />
              <div className="p-6">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7234BD] mb-5">Employment</p>
                <div className="space-y-4">
                  <InfoItem icon={Briefcase}    label="Job Title"        value={emp.job_title} />
                  <InfoItem icon={Building2}    label="Department"       value={emp.department} />
                  <InfoItem icon={Users}        label="Reports to"       value={managerName ? `${managerName}${managerTitle ? ` · ${managerTitle}` : ""}` : null} />
                  <InfoItem icon={CalendarDays} label="Hire Date"   value={hireDate} />
                </div>
              </div>
            </div>

            {/* Personal */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7234BD 0%, #FFBC00 50%, #7234BD 100%)" }} />
              <div className="p-6">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7234BD] mb-5">Personal</p>
                <div className="space-y-4">
                  <InfoItem icon={Cake}          label="Birthday"    value={birthday} />
                  <InfoItem icon={Hash}          label="Employee No" value={emp.employee_no} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </IntranetLayout>
  );
}

// ── Shared info row ───────────────────────────────────────────────────────────
function InfoItem({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | null | undefined; href?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-[#F3EEFF] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-[#7234BD]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        {href && value ? (
          <a href={href} className="text-sm font-semibold text-[#7234BD] hover:underline break-words leading-snug">{value}</a>
        ) : (
          <p className="text-sm font-semibold text-[#1C043B] break-words leading-snug">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}
