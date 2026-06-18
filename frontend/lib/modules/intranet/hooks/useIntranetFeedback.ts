"use client";

import { useState } from "react";
import type { FeedbackEntry } from "../types/intranet.types";

const INITIAL_FEEDBACK: FeedbackEntry[] = [
  { id: 1, submitted_by_id: 101, submitted_by_name: "Kemi Adeyemi",    submitted_by_dept: "Finance",      category: "Suggestion",  subject: "Intranet search improvements",        message: "It would be great if the search bar could also search within documents and FAQs, not just news.",                          is_anonymous: false, status: "open",      resolved_by_id: null, resolved_at: null, created_at: "2026-06-15T10:23:00Z" },
  { id: 2, submitted_by_id: null,submitted_by_name: null,              submitted_by_dept: null,           category: "General",     subject: "Canteen food quality",               message: "The quality of food at the head office canteen has dropped significantly. Please look into this.",                           is_anonymous: true,  status: "in_review", resolved_by_id: null, resolved_at: null, created_at: "2026-06-14T14:05:00Z" },
  { id: 3, submitted_by_id: 103, submitted_by_name: "Emeka Okafor",    submitted_by_dept: "Engineering",  category: "IT",          subject: "VPN connection keeps dropping",       message: "The VPN has been dropping every 30 minutes on average. IT have been informed but the issue persists for over a week.",     is_anonymous: false, status: "resolved",  resolved_by_id: 5,    resolved_at: "2026-06-16T09:00:00Z", created_at: "2026-06-10T09:12:00Z" },
  { id: 4, submitted_by_id: null,submitted_by_name: null,              submitted_by_dept: null,           category: "HR",          subject: "Leave approval taking too long",     message: "Leave requests are sitting unapproved for 2+ weeks. Line managers should be reminded to action these promptly.",           is_anonymous: true,  status: "open",      resolved_by_id: null, resolved_at: null, created_at: "2026-06-12T16:45:00Z" },
  { id: 5, submitted_by_id: 105, submitted_by_name: "Fatima Al-Hassan",submitted_by_dept: "HSE",          category: "Complaint",   subject: "PPE stock running low at Abuja site",message: "We are running critically low on safety boots and gloves at the Abuja station. This needs urgent attention before HSE audit.", is_anonymous: false, status: "in_review", resolved_by_id: null, resolved_at: null, created_at: "2026-06-11T11:30:00Z" },
];

export function useIntranetFeedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>(INITIAL_FEEDBACK);

  function updateStatus(id: number, status: FeedbackEntry["status"]) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status, resolved_at: status === "resolved" ? new Date().toISOString() : e.resolved_at }
          : e
      )
    );
  }

  function submit(entry: Omit<FeedbackEntry, "id" | "status" | "resolved_by_id" | "resolved_at" | "created_at">) {
    const id = Math.max(0, ...entries.map((e) => e.id)) + 1;
    setEntries((prev) => [
      { ...entry, id, status: "open", resolved_by_id: null, resolved_at: null, created_at: new Date().toISOString() },
      ...prev,
    ]);
  }

  return { entries, updateStatus, submit };
}
