// // lib/modules/audit/hooks/useAudit.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { AuditService } from "../services/audit.service";
import type { AuditEntityType } from "../types/audit.types";

export function useAuditByEntity(entityType: AuditEntityType, entityId: string) {
  const query = useQuery({
    queryKey: ["audit", entityType, entityId],
    queryFn:  () => AuditService.getByEntity(entityType, entityId),
    enabled:  !!entityId,
    staleTime: 30_000,
  });
  return {
    entries:   query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,

  };
}
