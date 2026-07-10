"use client";

import { useState } from "react";
import type { NewsItem } from "../types/intranet.types";

const PG = "https://portlandgasltd.com/wp-content/uploads/2026/03";
const NOW = new Date().toISOString();

const INITIAL_NEWS: NewsItem[] = [
  { id: 1, category: "Company News",   title: "Portland Gas Commissions New CNG Refuelling Station in Lekki",  body: "The newly commissioned station marks our 14th fuelling point in Lagos, expanding access to clean energy for fleet operators and private vehicle owners.", cover_image_id: null, cover_image_url: `${PG}/Portland-gas-46-1.png`,                author_name: "Corporate Communications",     is_published: true,  published_at: "2026-06-09T08:00:00Z", created_at: NOW, updated_at: NOW },
  { id: 2, category: "Announcement",   title: "Q2 2026 Town Hall — All Staff Meeting Thursday 12 June",         body: "The MD will address Q2 performance and strategic priorities for H2 2026, then open the floor to questions. Attendance is mandatory for all staff.",     cover_image_id: null, cover_image_url: `${PG}/NASENI-PORTLAND-GAS-LAUNCH-4-scaled-1.jpg`, author_name: "MD's Office",                  is_published: true,  published_at: "2026-06-08T08:00:00Z", created_at: NOW, updated_at: NOW },
  { id: 3, category: "Policy Update",  title: "Updated Remote Work & Flexible Hours Policy Effective 1 July",  body: "HR has published the revised hybrid work policy. All staff must read and acknowledge the new policy before end of June 2026.",                        cover_image_id: null, cover_image_url: `${PG}/Portland-gas-18.png`,                  author_name: "Human Resources",              is_published: true,  published_at: "2026-06-06T08:00:00Z", created_at: NOW, updated_at: NOW },
  { id: 4, category: "Project Update", title: "Phase 2 of Sagamu–Ibadan LNG Pipeline Now Underway",            body: "Engineering teams have mobilised to site as the second phase of the landmark pipeline project begins. Completion is targeted for Q4 2026.",            cover_image_id: null, cover_image_url: `${PG}/CNG-bus-fleet.jpg`,                    author_name: "Projects & Engineering",       is_published: true,  published_at: "2026-06-04T08:00:00Z", created_at: NOW, updated_at: NOW },
  { id: 5, category: "Safety",         title: "Mandatory HSE Refresher Training — All Field Staff by 30 June", body: "HSE has scheduled refresher sessions across all field locations. Supervisors must ensure 100% participation before the end-of-month deadline.",        cover_image_id: null, cover_image_url: `${PG}/Portland-gas-23.png`,                  author_name: "Health, Safety & Environment", is_published: true,  published_at: "2026-06-03T08:00:00Z", created_at: NOW, updated_at: NOW },
  { id: 6, category: "Events",         title: "Portland Gas Annual Family Fun Day — Saturday 28 June",         body: "Join us for a day of fun, food, and fellowship. Venue: Landmark Event Centre, Victoria Island. Registration closes 20 June.",                       cover_image_id: null, cover_image_url: `${PG}/KL7V2Q3.webp`,                        author_name: "Admin & Corporate Services",   is_published: true,  published_at: "2026-06-02T08:00:00Z", created_at: NOW, updated_at: NOW },
];

export function useIntranetNews() {
  const [items, setItems] = useState<NewsItem[]>(INITIAL_NEWS);

  function create(item: Omit<NewsItem, "id" | "created_at" | "updated_at">) {
    const id = Math.max(0, ...items.map((n) => n.id)) + 1;
    const ts = new Date().toISOString();
    setItems((prev) => [{ ...item, id, created_at: ts, updated_at: ts }, ...prev]);
  }

  function update(id: number, patch: Partial<Omit<NewsItem, "id" | "created_at">>) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n))
    );
  }

  function remove(id: number) {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  function togglePublished(id: number) {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, is_published: !n.is_published, published_at: !n.is_published ? new Date().toISOString() : n.published_at, updated_at: new Date().toISOString() }
          : n
      )
    );
  }

  return { items, create, update, remove, togglePublished };
}
