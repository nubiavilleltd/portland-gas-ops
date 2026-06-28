"use client";

import { useState } from "react";
import type { PodcastEpisode } from "../types/intranet.types";

const NOW = new Date().toISOString();

const INITIAL_EPISODES: PodcastEpisode[] = [
  { id: 1, episode_number: 12, title: "Nigeria's Gas-to-Power Opportunity — EP. 12", guest_name: "MD & Chief Engineer",      duration: "38 min", cover_image_url: "", audio_url: "", media_type: "audio", is_published: true,  is_featured: true,  created_at: NOW, updated_at: NOW },
  { id: 2, episode_number: 11, title: "Pipeline Safety & Inspection Standards",        guest_name: "Chief Operating Officer", duration: "44 min", cover_image_url: "", audio_url: "", media_type: "audio", is_published: true,  is_featured: false, created_at: NOW, updated_at: NOW },
  { id: 3, episode_number: 10, title: "Building a Culture of HSE Excellence",          guest_name: "Head of HSE",             duration: "31 min", cover_image_url: "", audio_url: "", media_type: "audio", is_published: true,  is_featured: false, created_at: NOW, updated_at: NOW },
  { id: 4, episode_number: 9,  title: "Procurement & Vendor Management in the Field",  guest_name: "Procurement Director",    duration: "27 min", cover_image_url: "", audio_url: "", media_type: "audio", is_published: false, is_featured: false, created_at: NOW, updated_at: NOW },
];

let nextId = 5;

export function useIntranetPodcast() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(INITIAL_EPISODES);

  const featured = episodes.find((e) => e.is_featured) ?? episodes[0] ?? null;

  function create(data: Omit<PodcastEpisode, "id" | "created_at" | "updated_at">) {
    const ts = new Date().toISOString();
    const id = nextId++;
    setEpisodes((prev) => {
      // If new episode is featured, unfeat the current one
      const updated = data.is_featured
        ? prev.map((e) => ({ ...e, is_featured: false }))
        : prev;
      return [{ ...data, id, created_at: ts, updated_at: ts }, ...updated];
    });
  }

  function update(id: number, patch: Partial<Omit<PodcastEpisode, "id" | "created_at">>) {
    setEpisodes((prev) => {
      let updated = prev.map((e) =>
        e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e
      );
      // If we're featuring this one, unfeat all others
      if (patch.is_featured) {
        updated = updated.map((e) => (e.id === id ? e : { ...e, is_featured: false }));
      }
      return updated;
    });
  }

  function remove(id: number) {
    setEpisodes((prev) => {
      const remaining = prev.filter((e) => e.id !== id);
      // If deleted episode was featured, feature the first published one
      const wasFeated = prev.find((e) => e.id === id)?.is_featured;
      if (wasFeated && remaining.length > 0) {
        const firstPub = remaining.find((e) => e.is_published) ?? remaining[0];
        return remaining.map((e) => (e.id === firstPub.id ? { ...e, is_featured: true } : e));
      }
      return remaining;
    });
  }

  function setFeatured(id: number) {
    setEpisodes((prev) =>
      prev.map((e) => ({ ...e, is_featured: e.id === id, updated_at: new Date().toISOString() }))
    );
  }

  function togglePublished(id: number) {
    setEpisodes((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, is_published: !e.is_published, updated_at: new Date().toISOString() } : e
      )
    );
  }

  return { episodes, featured, create, update, remove, setFeatured, togglePublished };
}
