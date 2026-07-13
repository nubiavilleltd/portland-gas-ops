// // lib/modules/audit/services/audit.service.ts

import api from "@/lib/api";
import type { AuditLogEntry, AuditEntityType } from "../types/audit.types";

interface BackendAuditEntry {
  id: string | number;
  entity_type: AuditLogEntry["entity_type"];
  entity_id: string;
  action: AuditLogEntry["action"];
  description: string;
  actor_type: "system" | "customer" | "employee";
  actor_employee_id?: string | null;
  actor_name?: string | null;
  metadata?: AuditLogEntry["metadata"] | null;
  created_at: string;
}

// Backend audit response → frontend AuditLogEntry
function adaptAuditEntry(raw: BackendAuditEntry): AuditLogEntry {
  return {
    id:          String(raw.id),
    entity_type: raw.entity_type,
    entity_id:   raw.entity_id,
    action:      raw.action,
    description: raw.description,
    actor:       raw.actor_type === "system"
      ? { type: "system" }
      : raw.actor_type === "customer"
        ? { type: "customer", customer_id: raw.actor_employee_id ?? "", name: raw.actor_name ?? "" }
        : { type: "employee", employee_id: raw.actor_employee_id ?? "", name: raw.actor_name ?? "Staff" },
    metadata:    raw.metadata ?? undefined,
    created_at:  raw.created_at,
  };
}

export class AuditService {
  static async getAll(): Promise<AuditLogEntry[]> {
    // Not called directly on frontend anymore — use useAuditByEntity instead
    return [];
  }

  static async getByEntity(
    entityType: AuditEntityType,
    entityId:   string,
  ): Promise<AuditLogEntry[]> {
    const { data } = await api.get("/api/audit", {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return (data as BackendAuditEntry[]).map(adaptAuditEntry);
  }

  static async record(): Promise<void> {
    // Frontend no longer records audit entries — backend does this
    // This method is kept as a no-op for backwards compatibility
    // during the transition period. Will be removed when all
    // workflow files are updated.
  }
}
