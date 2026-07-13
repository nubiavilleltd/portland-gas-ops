"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del, postForm } from "@/lib/api";
import { intranetKeys } from "./queries";
import type { NewsItem, NewsCategory, IntranetEvent, SpotlightEntry, SpotlightTag, LeadershipMessage } from "./types/intranet.types";

// cover_image_url is server-computed from the documents join — never sent in the payload
type NewsCreatePayload = Omit<NewsItem, "id" | "created_at" | "updated_at" | "cover_image_url">;
type NewsUpdatePayload = Partial<NewsCreatePayload>;

export type ImageUploadResult = { id: number; url: string };

// ── Category mutations ────────────────────────────────────────────────────────

export function useCreateNewsCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      post<NewsCategory>("/api/intranet/news/categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.newsCategories() }),
  });
}

export function useDeleteNewsCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/news/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.newsCategories() }),
  });
}

// ── Cover image upload mutations ──────────────────────────────────────────────

/** Upload a file → Cloudinary → documents table. Returns { id, url }. */
export function useUploadNewsImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return postForm<ImageUploadResult>("/api/intranet/news/upload-image", fd);
    },
  });
}

/** Fetch an external image URL into Cloudinary → documents table. Returns { id, url }. */
export function useUploadNewsImageFromUrl() {
  return useMutation({
    mutationFn: (url: string) =>
      post<ImageUploadResult>("/api/intranet/news/upload-image-from-url", { url }),
  });
}

// ── News mutations ────────────────────────────────────────────────────────────

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewsCreatePayload) =>
      post<NewsItem>("/api/intranet/news", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.news() });
      qc.invalidateQueries({ queryKey: intranetKeys.newsAdmin() });
    },
  });
}

export function useUpdateNews(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewsUpdatePayload) =>
      patch<NewsItem>(`/api/intranet/news/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.news() });
      qc.invalidateQueries({ queryKey: intranetKeys.newsAdmin() });
      qc.invalidateQueries({ queryKey: intranetKeys.newsDetail(id) });
    },
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/news/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.news() });
      qc.invalidateQueries({ queryKey: intranetKeys.newsAdmin() });
    },
  });
}

export function useToggleNewsPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<NewsItem>(`/api/intranet/news/${id}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.news() });
      qc.invalidateQueries({ queryKey: intranetKeys.newsAdmin() });
    },
  });
}

// ── Event mutations ────────────────────────────────────────────────────────────

type EventCreatePayload = Omit<IntranetEvent, "id" | "created_at" | "updated_at">;
type EventUpdatePayload = Partial<EventCreatePayload>;

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EventCreatePayload) =>
      post<IntranetEvent>("/api/intranet/events", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.events() });
      qc.invalidateQueries({ queryKey: intranetKeys.eventsAdmin() });
    },
  });
}

export function useUpdateEvent(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EventUpdatePayload) =>
      patch<IntranetEvent>(`/api/intranet/events/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.events() });
      qc.invalidateQueries({ queryKey: intranetKeys.eventsAdmin() });
      qc.invalidateQueries({ queryKey: intranetKeys.eventDetail(id) });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.events() });
      qc.invalidateQueries({ queryKey: intranetKeys.eventsAdmin() });
    },
  });
}

export function useToggleEventPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<IntranetEvent>(`/api/intranet/events/${id}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.events() });
      qc.invalidateQueries({ queryKey: intranetKeys.eventsAdmin() });
    },
  });
}

// ── Spotlight mutations (EOM + spotlight cards) ────────────────────────────────

type SpotlightCreatePayload = Omit<SpotlightEntry, "id" | "created_at" | "published_at">;
type SpotlightUpdatePayload = Partial<SpotlightCreatePayload>;

export function useCreateSpotlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SpotlightCreatePayload) =>
      post<SpotlightEntry>("/api/intranet/spotlight", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.spotlight() });
      qc.invalidateQueries({ queryKey: intranetKeys.spotlightAdmin() });
    },
  });
}

export function useUpdateSpotlight(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SpotlightUpdatePayload) =>
      patch<SpotlightEntry>(`/api/intranet/spotlight/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.spotlight() });
      qc.invalidateQueries({ queryKey: intranetKeys.spotlightAdmin() });
    },
  });
}

export function useDeleteSpotlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/spotlight/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.spotlight() });
      qc.invalidateQueries({ queryKey: intranetKeys.spotlightAdmin() });
    },
  });
}

export function useToggleSpotlightPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<SpotlightEntry>(`/api/intranet/spotlight/${id}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intranetKeys.spotlight() });
      qc.invalidateQueries({ queryKey: intranetKeys.spotlightAdmin() });
    },
  });
}

// ── Spotlight tag mutations ────────────────────────────────────────────────────

export function useCreateSpotlightTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { label: string; color: string; bg: string }) =>
      post<SpotlightTag>("/api/intranet/spotlight/tags", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.spotlightTags() }),
  });
}

export function useDeleteSpotlightTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/spotlight/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.spotlightTags() }),
  });
}

// ── Leadership mutations ───────────────────────────────────────────────────────

type LeadershipCreatePayload = Omit<LeadershipMessage, "id" | "created_at" | "updated_at" | "published_at">;
type LeadershipUpdatePayload = Partial<LeadershipCreatePayload>;

function invalidateLeadership(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: intranetKeys.leadership() });
  qc.invalidateQueries({ queryKey: intranetKeys.leadershipAdmin() });
}

export function useCreateLeadership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadershipCreatePayload) =>
      post<LeadershipMessage>("/api/intranet/leadership", data),
    onSuccess: () => invalidateLeadership(qc),
  });
}

export function useUpdateLeadership(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadershipUpdatePayload) =>
      patch<LeadershipMessage>(`/api/intranet/leadership/${id}`, data),
    onSuccess: () => invalidateLeadership(qc),
  });
}

export function useDeleteLeadership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/leadership/${id}`),
    onSuccess: () => invalidateLeadership(qc),
  });
}

export function useToggleLeadershipPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<LeadershipMessage>(`/api/intranet/leadership/${id}/publish`, {}),
    onSuccess: () => invalidateLeadership(qc),
  });
}

export function useReorderLeadership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: number; sort_order: number }[]) =>
      post<void>("/api/intranet/leadership/reorder", updates),
    onSuccess: () => invalidateLeadership(qc),
  });
}
