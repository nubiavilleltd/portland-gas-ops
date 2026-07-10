"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del, postForm } from "@/lib/api";
import { intranetKeys } from "./queries";
import type { NewsItem, NewsCategory } from "./types/intranet.types";

// cover_image_url is server-computed from the documents join — never sent in the payload
type NewsCreatePayload = Omit<NewsItem, "id" | "created_at" | "updated_at" | "cover_image_url">;
type NewsUpdatePayload = Partial<NewsCreatePayload>;

export type ImageUploadResult = { id: number; url: string };

// ── Category mutations ────────────────────────────────────────────────────────

export function useCreateNewsCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      post<NewsCategory>("/api/intranet/news/categories/", data),
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
      return postForm<ImageUploadResult>("/api/intranet/news/upload-image/", fd);
    },
  });
}

/** Fetch an external image URL into Cloudinary → documents table. Returns { id, url }. */
export function useUploadNewsImageFromUrl() {
  return useMutation({
    mutationFn: (url: string) =>
      post<ImageUploadResult>("/api/intranet/news/upload-image-from-url/", { url }),
  });
}

// ── News mutations ────────────────────────────────────────────────────────────

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewsCreatePayload) =>
      post<NewsItem>("/api/intranet/news/", data),
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
