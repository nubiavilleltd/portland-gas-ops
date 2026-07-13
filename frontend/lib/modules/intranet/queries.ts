"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { NewsItem, NewsCategory, IntranetEvent, SpotlightEntry, SpotlightTag, LeadershipMessage } from "./types/intranet.types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const intranetKeys = {
  newsCategories: () => ["intranet", "news", "categories"] as const,
  news:           () => ["intranet", "news"] as const,
  newsAdmin:      () => ["intranet", "news", "admin"] as const,
  newsDetail:     (id: number) => ["intranet", "news", id] as const,
  events:         () => ["intranet", "events"] as const,
  eventsAdmin:    () => ["intranet", "events", "admin"] as const,
  eventDetail:    (id: number) => ["intranet", "events", id] as const,
  spotlight:      () => ["intranet", "spotlight"] as const,
  spotlightAdmin: () => ["intranet", "spotlight", "admin"] as const,
  spotlightTags:     () => ["intranet", "spotlight", "tags"] as const,
  leadership:        () => ["intranet", "leadership"] as const,
  leadershipAdmin:   () => ["intranet", "leadership", "admin"] as const,
};

// ── Category queries ──────────────────────────────────────────────────────────

export function useIntranetNewsCategories() {
  return useQuery<NewsCategory[]>({
    queryKey: intranetKeys.newsCategories(),
    queryFn:  () => get<NewsCategory[]>("/api/intranet/news/categories"),
    staleTime: 5 * 60 * 1000,
  });
}

// ── News queries ──────────────────────────────────────────────────────────────

/** Published articles — used on the intranet home page */
export function useIntranetNewsPublished() {
  return useQuery<NewsItem[]>({
    queryKey: intranetKeys.news(),
    queryFn:  () => get<NewsItem[]>("/api/intranet/news"),
    staleTime: 60 * 1000,
  });
}

/** All articles including drafts — used on the admin page */
export function useIntranetNewsAdmin() {
  return useQuery<NewsItem[]>({
    queryKey: intranetKeys.newsAdmin(),
    queryFn:  () => get<NewsItem[]>("/api/intranet/news/admin"),
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

// ── Event queries ─────────────────────────────────────────────────────────────

export function useIntranetEventsPublished() {
  return useQuery<IntranetEvent[]>({
    queryKey: intranetKeys.events(),
    queryFn:  () => get<IntranetEvent[]>("/api/intranet/events"),
    staleTime: 60 * 1000,
  });
}

export function useIntranetEventsAdmin() {
  return useQuery<IntranetEvent[]>({
    queryKey: intranetKeys.eventsAdmin(),
    queryFn:  () => get<IntranetEvent[]>("/api/intranet/events/admin"),
    staleTime: 30 * 1000,
  });
}

export function useIntranetEventDetail(id: number) {
  return useQuery<IntranetEvent>({
    queryKey: intranetKeys.eventDetail(id),
    queryFn:  () => get<IntranetEvent>(`/api/intranet/events/${id}`),
    enabled:  !!id,
    staleTime: 60 * 1000,
  });
}

// ── Spotlight queries (EOM + spotlight cards) ─────────────────────────────────

export function useIntranetSpotlightPublished() {
  return useQuery<SpotlightEntry[]>({
    queryKey: intranetKeys.spotlight(),
    queryFn:  () => get<SpotlightEntry[]>("/api/intranet/spotlight"),
    staleTime: 60 * 1000,
  });
}

export function useIntranetSpotlightAdmin() {
  return useQuery<SpotlightEntry[]>({
    queryKey: intranetKeys.spotlightAdmin(),
    queryFn:  () => get<SpotlightEntry[]>("/api/intranet/spotlight/admin"),
    staleTime: 30 * 1000,
  });
}

export function useIntranetLeadershipPublished() {
  return useQuery<LeadershipMessage[]>({
    queryKey: intranetKeys.leadership(),
    queryFn:  () => get<LeadershipMessage[]>("/api/intranet/leadership"),
    staleTime: 60 * 1000,
  });
}

export function useIntranetLeadershipAdmin() {
  return useQuery<LeadershipMessage[]>({
    queryKey: intranetKeys.leadershipAdmin(),
    queryFn:  () => get<LeadershipMessage[]>("/api/intranet/leadership/admin"),
    staleTime: 30 * 1000,
  });
}

export function useIntranetSpotlightTags() {
  return useQuery<SpotlightTag[]>({
    queryKey: intranetKeys.spotlightTags(),
    queryFn:  () => get<SpotlightTag[]>("/api/intranet/spotlight/tags"),
    staleTime: 5 * 60 * 1000,
  });
}
