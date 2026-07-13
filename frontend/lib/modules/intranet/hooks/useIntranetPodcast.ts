"use client";

import { usePodcastsAdmin } from "../queries";
import {
  useCreatePodcast,
  useUpdatePodcast,
  useDeletePodcast,
  useTogglePodcastPublished,
  useSetPodcastFeatured,
  useUploadPodcastCover,
  useUploadPodcastAudio,
} from "../mutations";
import type { PodcastEpisode } from "../types/intranet.types";

export type { PodcastEpisode };

export function useIntranetPodcast() {
  const { data: episodes = [], isLoading, isFetching } = usePodcastsAdmin();

  const featured = episodes.find((e) => e.is_featured) ?? episodes.find((e) => e.is_published) ?? null;

  const createMutation         = useCreatePodcast();
  const updateMutation         = useUpdatePodcast();
  const deleteMutation         = useDeletePodcast();
  const togglePublishedMutation = useTogglePodcastPublished();
  const setFeaturedMutation    = useSetPodcastFeatured();

  function create(data: Omit<PodcastEpisode, "id" | "created_at" | "updated_at" | "cover_image_url" | "audio_file_url">) {
    return createMutation.mutateAsync(data);
  }

  function update(id: number, data: Partial<Omit<PodcastEpisode, "id" | "created_at" | "cover_image_url" | "audio_file_url">>) {
    return updateMutation.mutateAsync({ id, ...data });
  }

  function remove(id: number) {
    return deleteMutation.mutateAsync(id);
  }

  function togglePublished(id: number) {
    return togglePublishedMutation.mutateAsync(id);
  }

  function setFeatured(id: number) {
    return setFeaturedMutation.mutateAsync(id);
  }

  return {
    episodes,
    featured,
    isLoading,
    isFetching,
    create,
    update,
    remove,
    togglePublished,
    setFeatured,
    // Upload helpers — callers use these to get {id, url} before saving
    useUploadPodcastCover,
    useUploadPodcastAudio,
  };
}
