import { AuditEntityType } from "../types/audit.types";

export const AUDIT_KEYS = {
  all: ["audit"] as const,

  entity: (
    entityType: AuditEntityType,
    entityId: string,
  ) => [...AUDIT_KEYS.all, entityType, entityId] as const,
};