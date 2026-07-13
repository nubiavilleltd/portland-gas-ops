// @ts-nocheck — legacy local-state hook, superseded by useIntranetLeadershipAdmin / useIntranetLeadershipPublished
"use client";

import { useState } from "react";
import type { LeadershipMessage } from "../types/intranet.types";

const AV = "https://i.pravatar.cc/150";
const NOW = new Date().toISOString();

const INITIAL_MESSAGES: LeadershipMessage[] = [
  { id: 1, author_id: 1, author_name: "Adeola Ogunleye", author_role: "Managing Director",       author_dept: "MD's Office",  avatar_url: `${AV}?img=68`, title: "Message from the MD — June 2026",        body: "As we close Q2 and look ahead to an ambitious second half of 2026, I want to personally thank every one of you. The commissioning of our 14th CNG station is a testament to what this team achieves together. Our pipeline expansion is on schedule, our safety record remains strong, and our culture is one I am proud of every single day.", is_published: true, published_at: "2026-06-10T08:00:00Z", order: 0, created_at: NOW, updated_at: NOW },
  { id: 2, author_id: 2, author_name: "Chidi Okonkwo",   author_role: "Chief Executive Officer", author_dept: "CEO's Office", avatar_url: `${AV}?img=52`, title: "Message from the CEO — June 2026",        body: "Portland Gas is at an inflection point. The investments we are making today in infrastructure, people, and technology will define our next decade. I am proud to lead an organisation with this level of dedication.",                                                                                                                       is_published: true, published_at: "2026-06-05T08:00:00Z", order: 1, created_at: NOW, updated_at: NOW },
  { id: 3, author_id: 3, author_name: "Amaka Eze",        author_role: "Chief Operating Officer", author_dept: "Operations",   avatar_url: `${AV}?img=45`, title: "Message from the COO — June 2026",        body: "Operational excellence is not a destination — it is a daily commitment. Our teams in the field continue to deliver safely and on time, and that does not happen by accident. It happens because each of you shows up prepared, trained, and focused.",                                                                                    is_published: true, published_at: "2026-06-02T08:00:00Z", order: 2, created_at: NOW, updated_at: NOW },
];

export function useLeadershipMessages() {
  const [messages, setMessages] = useState<LeadershipMessage[]>(INITIAL_MESSAGES);

  function create(msg: Omit<LeadershipMessage, "id" | "created_at" | "updated_at">) {
    const id = Math.max(0, ...messages.map((m) => m.id)) + 1;
    const ts = new Date().toISOString();
    setMessages((prev) => [...prev, { ...msg, id, created_at: ts, updated_at: ts }]);
  }

  function update(id: number, patch: Partial<Omit<LeadershipMessage, "id" | "created_at">>) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch, updated_at: new Date().toISOString() } : m))
    );
  }

  function remove(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function togglePublished(id: number) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, is_published: !m.is_published, published_at: !m.is_published ? new Date().toISOString() : m.published_at, updated_at: new Date().toISOString() }
          : m
      )
    );
  }

  function move(id: number, direction: "up" | "down") {
    setMessages((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((m) => m.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const swapOrder = sorted[swapIdx].order;
      const itemOrder = sorted[idx].order;
      return prev.map((m) => {
        if (m.id === id) return { ...m, order: swapOrder };
        if (m.id === sorted[swapIdx].id) return { ...m, order: itemOrder };
        return m;
      });
    });
  }

  const published = [...messages]
    .filter((m) => m.is_published)
    .sort((a, b) => a.order - b.order);

  return { messages, published, create, update, remove, togglePublished, move };
}
