// // lib/modules/audit/types/audit.types.ts
// export type AuditEntityType = "order" | "trip" | "invoice" | "inventory_item";

// export interface AuditLogEntry {
//   id: string;
//   entity_type: AuditEntityType;
//   entity_id: string;
//   action: string;
//   description: string;
//   actor: string;
//   metadata?: Record<string, unknown>;
//   created_at: string;
// }

// export interface RecordAuditInput {
//   entity_type: AuditEntityType;
//   entity_id: string;
//   action: string;
//   description: string;
//   actor: string;
//   metadata?: Record<string, unknown>;
// }




// lib/modules/audit/types/audit.types.ts
export type AuditEntityType = "order" | "trip" | "invoice" | "inventory_item";

export type AuditActor =
  | { type: "employee"; employee_id: string; name: string }
  | { type: "system" }
  | { type: "customer"; customer_id: string; name: string };

export interface AuditLogEntry {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: string;
  description: string;
  actor: AuditActor;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RecordAuditInput {
  entity_type: AuditEntityType;
  entity_id: string;
  action: string;
  description: string;
  actor: AuditActor;
  metadata?: Record<string, unknown>;
}

// Helper for display
export function getActorLabel(actor: AuditActor): string {
  if (actor.type === "system") return "System";
  return actor.name;
}