import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CalendarClock,
  ClipboardCheck,
  GitBranch,
  Package,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";

export const WORKSPACE_PREFERENCES_STORAGE_KEY = "workspace-preferences";

export type FeatureId = "crm" | "finance-hr" | "operations" | "safety" | "supply-chain";
export type AutomationId =
  | "approval-notifications"
  | "overdue-approval-alerts"
  | "safety-follow-up-reminders"
  | "leave-request-reminders"
  | "birthday-notifications";

export interface WorkspaceFeature {
  id: FeatureId;
  label: string;
  description: string;
  icon: LucideIcon;
  moduleGroupTitle: string;
}

export interface WorkspaceAutomation {
  id: AutomationId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const WORKSPACE_FEATURES: readonly WorkspaceFeature[] = [
  {
    id: "crm",
    label: "Customer relationship management",
    description: "Customers, contacts, and customer visits",
    icon: Users,
    moduleGroupTitle: "Customer Relationship Management",
  },
  {
    id: "finance-hr",
    label: "Finance & HR management",
    description: "Cash requisitions, invoices, leave, and payslips",
    icon: GitBranch,
    moduleGroupTitle: "Finance & HR Management",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Orders, trips, dispatch, and delivery tracking",
    icon: Truck,
    moduleGroupTitle: "Operations",
  },
  {
    id: "safety",
    label: "Safety & compliance",
    description: "Incidents, hazards, work authorization, and close-out",
    icon: ShieldAlert,
    moduleGroupTitle: "Safety & Compliance",
  },
  {
    id: "supply-chain",
    label: "Supply chain",
    description: "Assets, purchase requests, vendors, and stock",
    icon: Package,
    moduleGroupTitle: "Supply Chain",
  },
];

export const WORKSPACE_AUTOMATIONS: readonly WorkspaceAutomation[] = [
  {
    id: "approval-notifications",
    label: "Approval notifications",
    description: "Notify approvers when a request needs their action",
    icon: BellRing,
  },
  {
    id: "overdue-approval-alerts",
    label: "Overdue approval alerts",
    description: "Follow up when an approval has been waiting too long",
    icon: ClipboardCheck,
  },
  {
    id: "safety-follow-up-reminders",
    label: "Safety follow-up reminders",
    description: "Remind owners about open incidents and corrective actions",
    icon: ShieldAlert,
  },
  {
    id: "leave-request-reminders",
    label: "Leave request reminders",
    description: "Nudge managers about pending leave requests",
    icon: CalendarClock,
  },
  {
    id: "birthday-notifications",
    label: "Birthday notifications",
    description: "Highlight upcoming birthdays for the team",
    icon: Users,
  },
];

export const DEFAULT_ENABLED_FEATURES = WORKSPACE_FEATURES.map((feature) => feature.id);
export const DEFAULT_ENABLED_AUTOMATIONS: AutomationId[] = [];

export interface WorkspacePreferences {
  enabledFeatures: FeatureId[];
  enabledAutomations: AutomationId[];
}

interface WorkspacePreferencesState extends WorkspacePreferences {
  hasHydrated: boolean;
  setPreferences: (preferences: WorkspacePreferences) => void;
  resetPreferences: () => void;
}

export const useWorkspacePreferences = create<WorkspacePreferencesState>()(
  persist(
    (set) => ({
      enabledFeatures: DEFAULT_ENABLED_FEATURES,
      enabledAutomations: DEFAULT_ENABLED_AUTOMATIONS,
      hasHydrated: false,
      setPreferences: ({ enabledFeatures, enabledAutomations }) =>
        set({
          enabledFeatures: [...new Set(enabledFeatures)],
          enabledAutomations: [...new Set(enabledAutomations)],
        }),
      resetPreferences: () =>
        set({
          enabledFeatures: DEFAULT_ENABLED_FEATURES,
          enabledAutomations: DEFAULT_ENABLED_AUTOMATIONS,
        }),
    }),
    {
      name: WORKSPACE_PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      skipHydration: true,
      partialize: ({ enabledFeatures, enabledAutomations }) => ({
        enabledFeatures,
        enabledAutomations,
      }),
      onRehydrateStorage: () => () => {
        useWorkspacePreferences.setState({ hasHydrated: true });
      },
    },
  ),
);

export function filterModuleGroupsByFeatures<T extends { title: string }>(
  groups: readonly T[],
  enabledFeatures: readonly FeatureId[],
): T[] {
  const enabledGroupTitles = new Set(
    WORKSPACE_FEATURES
      .filter((feature) => enabledFeatures.includes(feature.id))
      .map((feature) => feature.moduleGroupTitle),
  );

  return groups.filter((group) => enabledGroupTitles.has(group.title));
}
