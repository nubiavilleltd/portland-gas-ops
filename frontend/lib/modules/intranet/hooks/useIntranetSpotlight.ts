"use client";

import { useState } from "react";
import type { SpotlightEntry } from "../types/intranet.types";

const AV = "https://i.pravatar.cc/150";
const NOW = new Date().toISOString();

// Employee of the Month — category: "employee_of_month"
const INITIAL_EOM: SpotlightEntry = {
  id: 1,
  employee_id: 101,
  employee_name: "Adaeze Nwankwo",
  employee_role: "Procurement Manager",
  employee_dept: "Supply Chain",
  avatar_url: `${AV}?img=49`,
  title: "Employee of the Month — June 2026",
  message: "Adaeze led our vendor rationalisation initiative, cutting procurement cycle time by 34% in Q2. Her process discipline and mentorship of junior colleagues embodies the Portland Gas standard.",
  category: "employee_of_month",
  month: 6,
  year: 2026,
  tag: "Employee of the Month",
  tag_color: "#7234BD",
  tag_bg: "#F3EEFF",
  is_published: true,
  published_at: "2026-06-01T08:00:00Z",
  created_at: NOW,
};

// Spotlight cards — category: "achievement"
const INITIAL_SPOTLIGHT: SpotlightEntry[] = [
  { id: 2, employee_id: 102, employee_name: "Obinna Eze",    employee_role: "Senior Field Engineer", employee_dept: "Operations",         avatar_url: `${AV}?img=33`, title: "Spotlight — Obinna Eze",    message: "Led the safe commissioning of three new CNG stations ahead of schedule in Q1.",                          category: "achievement", month: 6, year: 2026, tag: "Safety Champion",   tag_color: "#166534", tag_bg: "#F0FDF4", is_published: true, published_at: "2026-06-01T08:00:00Z", created_at: NOW },
  { id: 3, employee_id: 103, employee_name: "Halima Musa",   employee_role: "Finance Analyst",       employee_dept: "Finance & Strategy", avatar_url: `${AV}?img=25`, title: "Spotlight — Halima Musa",   message: "Redesigned the monthly close process, reducing reporting time from 5 days to 2.",                       category: "achievement", month: 6, year: 2026, tag: "Process Innovator", tag_color: "#1E40AF", tag_bg: "#EFF6FF", is_published: true, published_at: "2026-06-01T08:00:00Z", created_at: NOW },
  { id: 4, employee_id: 104, employee_name: "Tobi Adeyinka", employee_role: "Fleet Coordinator",     employee_dept: "Logistics",          avatar_url: `${AV}?img=60`, title: "Spotlight — Tobi Adeyinka", message: "Achieved 98% on-time delivery rate for Q2, the highest in the department's history.",                category: "achievement", month: 6, year: 2026, tag: "Top Performer",     tag_color: "#7234BD", tag_bg: "#F3EEFF", is_published: true, published_at: "2026-06-01T08:00:00Z", created_at: NOW },
];

export function useEmployeeOfMonth() {
  const [eom, setEom] = useState<SpotlightEntry>(INITIAL_EOM);

  function update(patch: Partial<Omit<SpotlightEntry, "id" | "created_at" | "category">>) {
    setEom((prev) => ({ ...prev, ...patch }));
  }

  return { eom, update };
}

export function useEmployeeSpotlight() {
  const [cards, setCards] = useState<SpotlightEntry[]>(INITIAL_SPOTLIGHT);

  function update(id: number, patch: Partial<Omit<SpotlightEntry, "id" | "created_at" | "category">>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function add(entry: Omit<SpotlightEntry, "id" | "created_at" | "category">) {
    if (cards.length >= 3) return; // max 3 spotlight cards
    const id = Math.max(0, ...cards.map((c) => c.id)) + 10;
    setCards((prev) => [...prev, { ...entry, id, category: "achievement", created_at: new Date().toISOString() }]);
  }

  function remove(id: number) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return { cards, update, add, remove };
}
