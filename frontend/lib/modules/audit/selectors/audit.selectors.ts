// lib/modules/audit/selectors/audit.selectors.ts
import type { AuditLogEntry, AuditEntityType } from "../types/audit.types";

export function getAuditByEntity(
  entries: AuditLogEntry[],
  entityType: AuditEntityType,
  entityId: string
): AuditLogEntry[] {
  return entries
    .filter((e) => e.entity_type === entityType && e.entity_id === entityId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}