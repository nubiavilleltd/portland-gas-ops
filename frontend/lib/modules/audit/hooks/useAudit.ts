// // lib/modules/audit/hooks/useAudit.ts
// "use client";
// import { useQuery } from "@tanstack/react-query";
// import { AuditService } from "../services/audit.service";
// import { getAuditByEntity } from "../selectors/audit.selectors";
// import type { AuditEntityType } from "../types/audit.types";

// export function useAuditLog() {
//   const query = useQuery({
//     queryKey: ["audit", "all"],
//     queryFn: AuditService.getAll,
//   });
//   return { entries: query.data ?? [], isLoading: query.isLoading };
// }

// export function useAuditByEntity(entityType: AuditEntityType, entityId: string) {
//   const { entries, isLoading } = useAuditLog();
//   return {
//     entries: getAuditByEntity(entries, entityType, entityId),
//     isLoading,
//   };
// }




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
  };
}

// Keep for backwards compatibility
export function useAuditLog() {
  return { entries: [], isLoading: false };
}