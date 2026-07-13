"use client";

import { useIntranetFeedbackAdmin } from "../queries";
import { useUpdateFeedbackStatus } from "../mutations";
import type { FeedbackEntry, FeedbackStatus } from "../types/intranet.types";

/**
 * Convenience hook for the admin feedback inbox page.
 * Wraps useIntranetFeedbackAdmin + useUpdateFeedbackStatus into the same
 * { entries, updateStatus } shape the page already expects.
 */
export function useIntranetFeedback() {
  const { data: entries = [], isLoading, isFetching } = useIntranetFeedbackAdmin();
  const updateStatusMutation = useUpdateFeedbackStatus();

  function updateStatus(id: number, status: FeedbackStatus) {
    return updateStatusMutation.mutateAsync({ id, status });
  }

  return { entries, isLoading, isFetching, updateStatus };
}
