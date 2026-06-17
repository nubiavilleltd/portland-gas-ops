// lib/modules/audit/constants/current-actor.ts
import type { AuditActor } from "../types/audit.types";

// TEMPORARY — replace with real session user once auth is implemented
export const CURRENT_ACTOR: AuditActor = {
  type: "employee",
  employee_id: "emp-001",
  name: "Admin",
};

export const SYSTEM_ACTOR: AuditActor = { type: "system" };