"use client";

import { useState } from "react";
import type { IntranetEvent } from "../types/intranet.types";

const NOW = new Date().toISOString();

const INITIAL_EVENTS: IntranetEvent[] = [
  { id: 1, title: "Q2 All-Staff Town Hall — MD Briefing",        description: "", event_type: "Town Hall", location: "Head Office, Boardroom A",     virtual_link: "", event_date: "2026-06-12", color: "#7234BD", is_published: true, created_at: NOW, updated_at: NOW },
  { id: 2, title: "HSE Field Safety Refresher — Lagos Stations", description: "", event_type: "Training",  location: "Portland Gas Training Centre", virtual_link: "", event_date: "2026-06-18", color: "#166534", is_published: true, created_at: NOW, updated_at: NOW },
  { id: 3, title: "Q2 Performance Appraisal Submissions Due",    description: "", event_type: "Deadline",  location: "HR Portal (online)",           virtual_link: "", event_date: "2026-06-20", color: "#C2410C", is_published: true, created_at: NOW, updated_at: NOW },
  { id: 4, title: "Fleet Conversion Technology Symposium",       description: "", event_type: "Workshop",  location: "Eko Hotel Convention Centre",  virtual_link: "", event_date: "2026-06-25", color: "#1E40AF", is_published: true, created_at: NOW, updated_at: NOW },
  { id: 5, title: "Annual Family Fun Day 2026",                  description: "", event_type: "Social",    location: "Landmark Event Centre, VI",    virtual_link: "", event_date: "2026-06-28", color: "#B45309", is_published: true, created_at: NOW, updated_at: NOW },
];

export function useIntranetEvents() {
  const [items, setItems] = useState<IntranetEvent[]>(INITIAL_EVENTS);

  function create(item: Omit<IntranetEvent, "id" | "created_at" | "updated_at">) {
    const id = Math.max(0, ...items.map((e) => e.id)) + 1;
    const ts = new Date().toISOString();
    setItems((prev) => [...prev, { ...item, id, created_at: ts, updated_at: ts }]);
  }

  function update(id: number, patch: Partial<Omit<IntranetEvent, "id" | "created_at">>) {
    setItems((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e))
    );
  }

  function remove(id: number) {
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  function togglePublished(id: number) {
    setItems((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, is_published: !e.is_published, updated_at: new Date().toISOString() } : e
      )
    );
  }

  return { items, create, update, remove, togglePublished };
}
