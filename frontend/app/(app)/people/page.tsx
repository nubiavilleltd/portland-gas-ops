"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Mail, Phone, Users, Cake, Search } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetPageHero from "@/components/ui/IntranetPageHero";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import FormSelect from "@/components/forms/FormSelect";
import { useEmployees } from "@/lib/modules/employees/hooks";
import type { Department } from "@/lib/modules/employees/types";

const PAGE_SIZE = 12;

const DEPARTMENTS: Department[] = [
  "Operations", "Finance", "HSE", "HR", "IT",
  "Logistics", "Executive", "Engineering", "Procurement", "Admin",
];

export default function PeoplePage() {
  const { data: employees = [], isLoading } = useEmployees();

  const [q,    setQ]    = useState("");
  const [dept, setDept] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const name = `${e.user?.first_name ?? ""} ${e.user?.last_name ?? ""}`.trim().toLowerCase();
      const role = (e.job_title ?? "").toLowerCase();
      const matchQ    = !q    || name.includes(q.toLowerCase()) || role.includes(q.toLowerCase());
      const matchDept = !dept || e.department === dept;
      return matchQ && matchDept;
    });
  }, [employees, q, dept]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) { setQ(val);   setPage(1); }
  function handleDept(val: string)   { setDept(val); setPage(1); }

  return (
    <IntranetLayout>
      <IntranetPageHero
        title="Employee Directory"
        subtitle="Find your colleagues — names, roles, departments and contact info."
        imageSrc="https://portlandgasltd.com/wp-content/uploads/2026/03/Portland-gas-29-scaled-1.png"
      />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">

        {/* Filter row — select + count LEFT, search RIGHT */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-44 shrink-0">
            <FormSelect
              value={dept}
              placeholder="All Departments"
              options={[
                { value: "", label: "All Departments" },
                ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
              ]}
              onValueChange={handleDept}
            />
          </div>
          {!isLoading && (
            <span className="text-sm font-semibold text-[#1C043B] shrink-0">
              {filtered.length} {filtered.length === 1 ? "person" : "people"}
            </span>
          )}
          <div className="relative ml-auto shrink-0">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or role…"
              className="py-2 w-72 pl-9 pr-5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#7234BD]/20 focus:border-[#7234BD]/40 transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <Users size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No employees found</p>
            {(q || dept) && (
              <button
                onClick={() => { setQ(""); setDept(""); setPage(1); }}
                className="mt-3 text-xs text-[#7234BD] font-semibold hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visible.map((emp) => {
              const fullName = `${emp.user?.first_name ?? ""} ${emp.user?.last_name ?? ""}`.trim() || "—";
              const birthday = emp.birthday
                ? new Date(emp.birthday + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : null;
              return (
                <Link
                  key={emp.id}
                  href={`/people/${emp.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Avatar
                    name={fullName}
                    src={emp.user?.profile_picture_url}
                    size="lg"
                    className="ring-4 ring-gray-100 group-hover:ring-[#7234BD]/20 transition-all mb-4"
                  />
                  <h3 className="font-bold text-sm text-[#1C043B] leading-snug mb-0.5 group-hover:text-[#7234BD] transition-colors">
                    {fullName}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">{emp.job_title ?? "—"}</p>

                  {/* Dept + employment type */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                    {emp.department && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3EEFF] text-[#7234BD]">
                        {emp.department}
                      </span>
                    )}
                    {emp.employment_type && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {emp.employment_type}
                      </span>
                    )}
                  </div>

                  <div className="w-full space-y-1.5 mt-auto pt-4 border-t border-gray-100">
                    {emp.user?.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={11} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-500 truncate">{emp.user.email}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={11} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-500 truncate">{emp.phone}</span>
                      </div>
                    )}
                    {birthday && (
                      <div className="flex items-center gap-2">
                        <Cake size={11} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-500">{birthday}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </IntranetLayout>
  );
}
