// // lib/modules/audit/services/audit.service.ts
// import { auditLog } from "../mock/audit.mock";
// import type { AuditLogEntry, RecordAuditInput, AuditEntityType } from "../types/audit.types";

// export class AuditService {
//   static async getAll(): Promise<AuditLogEntry[]> {
//     return Promise.resolve([...auditLog]);
//   }

//   static async getByEntity(
//     entityType: AuditEntityType,
//     entityId: string
//   ): Promise<AuditLogEntry[]> {
//     return Promise.resolve(
//       auditLog.filter(
//         (e) => e.entity_type === entityType && e.entity_id === entityId
//       )
//     );
//   }

//   static async record(input: RecordAuditInput): Promise<AuditLogEntry> {
//     const entry: AuditLogEntry = {
//       ...input,
//       id: `aud-${Date.now()}`,
//       created_at: new Date().toISOString(),
//     };
//     auditLog.push(entry);
//     return Promise.resolve(entry);
//   }
// }





import api from "@/lib/api";
import type { AuditLogEntry, AuditEntityType } from "../types/audit.types";

// Backend audit response → frontend AuditLogEntry
function adaptAuditEntry(raw: any): AuditLogEntry {
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
    const { data } = await api.get("/api/audit/", {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return (data as any[]).map(adaptAuditEntry);
  }

  static async record(_input: any): Promise<any> {
    // Frontend no longer records audit entries — backend does this
    // This method is kept as a no-op for backwards compatibility
    // during the transition period. Will be removed when all
    // workflow files are updated.
    return Promise.resolve();
  }
}