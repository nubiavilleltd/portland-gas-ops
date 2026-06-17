// lib/modules/audit/services/audit.service.ts
import { auditLog } from "../mock/audit.mock";
import type { AuditLogEntry, RecordAuditInput, AuditEntityType } from "../types/audit.types";

export class AuditService {
  static async getAll(): Promise<AuditLogEntry[]> {
    return Promise.resolve([...auditLog]);
  }

  static async getByEntity(
    entityType: AuditEntityType,
    entityId: string
  ): Promise<AuditLogEntry[]> {
    return Promise.resolve(
      auditLog.filter(
        (e) => e.entity_type === entityType && e.entity_id === entityId
      )
    );
  }

  static async record(input: RecordAuditInput): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      ...input,
      id: `aud-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    auditLog.push(entry);
    return Promise.resolve(entry);
  }
}