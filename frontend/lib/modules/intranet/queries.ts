"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { NewsItem, NewsCategory } from "./types/intranet.types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const intranetKeys = {
  newsCategories: () => ["intranet", "news", "categories"] as const,
  news:           () => ["intranet", "news"] as const,
  newsAdmin:      () => ["intranet", "news", "admin"] as const,
  newsDetail:     (id: number) => ["intranet", "news", id] as const,
};

// ── Category queries ──────────────────────────────────────────────────────────

export function useIntranetNewsCategories() {
  return useQuery<NewsCategory[]>({
    queryKey: intranetKeys.newsCategories(),
    queryFn:  () => get<NewsCategory[]>("/api/intranet/news/categories/"),
    staleTime: 5 * 60 * 1000,
  });
}

// ── News queries ──────────────────────────────────────────────────────────────

/** Published articles — used on the intranet home page */
export function useIntranetNewsPublished() {
  return useQuery<NewsItem[]>({
    queryKey: intranetKeys.news(),
    queryFn:  () => get<NewsItem[]>("/api/intranet/news/"),
    staleTime: 60 * 1000,
  });
}

/** All articles including drafts — used on the admin page */
export function useIntranetNewsAdmin() {
  return useQuery<NewsItem[]>({
    queryKey: intranetKeys.newsAdmin(),
    queryFn:  () => get<NewsItem[]>("/api/intranet/news/admin/"),
    staleTime: 30 * 1000,
  });
}

/** Single published article by id — used on the detail page */
export function useIntranetNewsDetail(id: number) {
  return useQuery<NewsItem>({
    queryKey: intranetKeys.newsDetail(id),
    queryFn:  () => get<NewsItem>(`/api/intranet/news/${id}`),
    enabled:  !!id,
    staleTime: 60 * 1000,
  });
}
