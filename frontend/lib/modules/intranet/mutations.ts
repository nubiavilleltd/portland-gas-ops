"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del, postForm } from "@/lib/api";
import { intranetKeys } from "./queries";
import type { NewsItem, NewsCategory, IntranetEvent, SpotlightEntry, SpotlightTag, LeadershipMessage, FAQItem, FAQCategory, FeedbackEntry, FeedbackStatus, PodcastEpisode } from "./types/intranet.types";

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

export function useUpdateNewsCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; color?: string }) =>
      patch<NewsCategory>(`/api/intranet/news/categories/${id}`, data),
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

export function useUpdateSpotlightTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; label?: string; color?: string; bg?: string }) =>
      patch<SpotlightTag>(`/api/intranet/spotlight/tags/${id}`, data),
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

// ── FAQ helpers ───────────────────────────────────────────────────────────────

function invalidateFAQs(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: intranetKeys.faqs() });
  qc.invalidateQueries({ queryKey: intranetKeys.faqsPublished() });
}

// ── FAQ category mutations ────────────────────────────────────────────────────

export function useCreateFAQCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { label: string; sort_order?: number }) =>
      post<FAQCategory>("/api/intranet/faqs/categories/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.faqCategories() }),
  });
}

export function useUpdateFAQCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; label?: string; sort_order?: number }) =>
      patch<FAQCategory>(`/api/intranet/faqs/categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.faqCategories() }),
  });
}

export function useDeleteFAQCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/faqs/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.faqCategories() }),
  });
}

export function useToggleFAQCategoryVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: number) =>
      patch<FAQCategory>(`/api/intranet/faqs/categories/${categoryId}/visibility`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.faqCategories() }),
  });
}

// ── FAQ mutations ─────────────────────────────────────────────────────────────

type FAQCreatePayload = Omit<FAQItem, "id" | "created_at" | "updated_at">;
type FAQUpdatePayload = Partial<FAQCreatePayload>;

export function useCreateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FAQCreatePayload) =>
      post<FAQItem>("/api/intranet/faqs/", data),
    onSuccess: () => invalidateFAQs(qc),
  });
}

export function useUpdateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: FAQUpdatePayload & { id: number }) =>
      patch<FAQItem>(`/api/intranet/faqs/${id}`, data),
    onSuccess: () => invalidateFAQs(qc),
  });
}

export function useDeleteFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/faqs/${id}`),
    onSuccess: () => invalidateFAQs(qc),
  });
}

export function useToggleFAQPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<FAQItem>(`/api/intranet/faqs/${id}/publish`, {}),
    onSuccess: () => invalidateFAQs(qc),
  });
}

export function useReorderFAQs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: number; order_index: number }[]) =>
      post<void>("/api/intranet/faqs/reorder", updates),
    onSuccess: () => invalidateFAQs(qc),
  });
}

// ── Feedback mutations ────────────────────────────────────────────────────────

type FeedbackSubmitPayload = {
  category: string;
  subject: string;
  message: string;
  is_anonymous: boolean;
};

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FeedbackSubmitPayload) =>
      post<FeedbackEntry>("/api/intranet/feedback/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.feedbackAdmin() }),
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeedbackStatus }) =>
      patch<FeedbackEntry>(`/api/intranet/feedback/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: intranetKeys.feedbackAdmin() }),
  });
}

// ── Podcast mutations ─────────────────────────────────────────────────────────

type PodcastCreatePayload = Omit<PodcastEpisode, "id" | "created_at" | "updated_at" | "cover_image_url" | "audio_file_url">;
type PodcastUpdatePayload = Partial<PodcastCreatePayload>;

function invalidatePodcast(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: intranetKeys.podcast() });
  qc.invalidateQueries({ queryKey: intranetKeys.podcastAdmin() });
}

export function useUploadPodcastCover() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return postForm<ImageUploadResult>("/api/intranet/podcast/upload-cover/", fd);
    },
  });
}

export function useUploadPodcastAudio() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return postForm<ImageUploadResult>("/api/intranet/podcast/upload-audio/", fd);
    },
  });
}

export function useCreatePodcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PodcastCreatePayload) =>
      post<PodcastEpisode>("/api/intranet/podcast/", data),
    onSuccess: () => invalidatePodcast(qc),
  });
}

export function useUpdatePodcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: PodcastUpdatePayload & { id: number }) =>
      patch<PodcastEpisode>(`/api/intranet/podcast/${id}`, data),
    onSuccess: (_data, { id }) => {
      invalidatePodcast(qc);
      qc.invalidateQueries({ queryKey: intranetKeys.podcastDetail(id) });
    },
  });
}

export function useDeletePodcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/intranet/podcast/${id}`),
    onSuccess: () => invalidatePodcast(qc),
  });
}

export function useTogglePodcastPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<PodcastEpisode>(`/api/intranet/podcast/${id}/publish`, {}),
    onSuccess: () => invalidatePodcast(qc),
  });
}

export function useSetPodcastFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      patch<PodcastEpisode>(`/api/intranet/podcast/${id}/feature`, {}),
    onSuccess: () => invalidatePodcast(qc),
  });
}
