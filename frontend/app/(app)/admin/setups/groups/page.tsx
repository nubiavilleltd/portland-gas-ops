"use client";

import { useState } from "react";
import { Plus, Users2, UserMinus, UserPlus } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { useGroups, useGroup, useCreateGroup, useAddGroupMember, useRemoveGroupMember } from "@/lib/modules/setups";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useToast } from "@/hooks/useToast";
import type { GroupListItem } from "@/types/setups";

// ── Group list sidebar ────────────────────────────────────────────────────────

function GroupList({
  groups,
  selectedId,
  onSelect,
  onAdd,
}: {
  groups: GroupListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="w-72 shrink-0 border-r border-brand-border flex flex-col">
      <div className="p-4 border-b border-brand-border flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">Groups</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-xs text-brand-purple hover:underline"
        >
          <Plus size={12} /> New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="text-xs text-brand-text-secondary p-4 text-center">No groups yet.</p>
        ) : (
          groups.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={[
                "w-full text-left px-4 py-3 border-b border-brand-border/50 hover:bg-gray-50 transition-colors",
                selectedId === g.id ? "bg-brand-purple/5 border-l-2 border-l-brand-purple" : "",
              ].join(" ")}
            >
              <p className="text-sm font-medium text-brand-text-primary truncate">{g.name}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                {!g.is_active && " · Inactive"}
                {g.group_type !== "general" && ` · ${g.group_type}`}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const toast = useToast();
  const { data: groups = [], isLoading } = useGroups();
  const createGroup = useCreateGroup();

  const [selectedId, setSelectedId]             = useState<string | null>(null);
  const [showNewGroupForm, setShowNewGroupForm]  = useState(false);
  const [newGroupName, setNewGroupName]           = useState("");
  const [newGroupDesc, setNewGroupDesc]           = useState("");
  const [removeMemberId, setRemoveMemberId]       = useState<string | null>(null);
  const [pickedMember, setPickedMember]           = useState<PickedEmployee | null>(null);

  const { data: selectedGroup } = useGroup(selectedId ?? "");
  const addMember    = useAddGroupMember(selectedId ?? "");
  const removeMember = useRemoveGroupMember(selectedId ?? "");

  const { data: allEmployeeList = [] } = useEmployees();
  const existingMemberIds = new Set((selectedGroup?.members ?? []).map((m) => m.employee_id));
  const availableEmployees: PickedEmployee[] = allEmployeeList
    .filter((e) => !existingMemberIds.has(e.id))
    .map((e) => ({
      id:         e.id,
      name:       [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || "Unknown",
      role:       e.job_title ?? e.user?.role ?? "",
      department: e.department ?? "",
      avatar_url: e.user?.profile_picture_url,
    }));

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) { toast.error("Group name is required"); return; }
    try {
      const res = await createGroup.mutateAsync({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined });
      toast.success("Group created");
      setShowNewGroupForm(false);
      setNewGroupName("");
      setNewGroupDesc("");
      // @ts-expect-error — response shape
      setSelectedId(res.id);
    } catch {
      toast.error("Failed to create group");
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!pickedMember) { toast.error("Please select an employee"); return; }
    try {
      await addMember.mutateAsync(pickedMember.id);
      setPickedMember(null);
      toast.success("Member added");
    } catch {
      toast.error("Failed to add member");
    }
  }

  async function handleRemoveMember() {
    if (!removeMemberId) return;
    try {
      await removeMember.mutateAsync(removeMemberId);
      setRemoveMemberId(null);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <AppLayout pageTitle="Setups — Groups">
      <BackButton href="/admin" label="Back to Admin" />

      <PageHeader
        title="Groups"
        description="Named lists of people used in workflow approval steps and other processes."
        className="mb-5"
      />

      {isLoading ? (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden flex min-h-[500px] animate-pulse">
          <div className="w-72 shrink-0 border-r border-brand-border flex flex-col">
            <div className="p-4 border-b border-brand-border">
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
            <div className="flex-1 p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-3 py-3 rounded-lg border border-brand-border/50">
                  <div className="h-3 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-3 w-64 bg-gray-100 rounded" />
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg border border-brand-border" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden flex min-h-[500px]">
          <GroupList
            groups={groups}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => { setShowNewGroupForm(true); setSelectedId(null); }}
          />

          <div className="flex-1 p-6 overflow-y-auto">
            {/* New group form */}
            {showNewGroupForm && (
              <div>
                <h2 className="text-lg font-semibold text-brand-text-primary mb-4">New Group</h2>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <FormInput
                    label="Group Name"
                    required
                    placeholder="e.g. SODA Approvers, Executive Committee"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <FormTextarea
                    label="Description (optional)"
                    rows={2}
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowNewGroupForm(false)}
                      className="px-4 py-2 text-sm text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={createGroup.isPending}>
                      {createGroup.isPending ? "Creating…" : "Create Group"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Group detail */}
            {!showNewGroupForm && selectedGroup && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-brand-text-primary">{selectedGroup.name}</h2>
                  {selectedGroup.description && (
                    <p className="text-sm text-brand-text-secondary mt-0.5">{selectedGroup.description}</p>
                  )}
                  <p className="text-xs text-brand-text-secondary mt-1">
                    {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Members list */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-3">Members</p>
                  {selectedGroup.members.length === 0 ? (
                    <p className="text-sm text-brand-text-secondary">No members yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedGroup.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-brand-border">
                          <div className="h-8 w-8 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0 text-xs font-semibold text-brand-purple">
                            {m.employee_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-text-primary truncate">{m.employee_name}</p>
                            <p className="text-xs text-brand-text-secondary">{m.employee_no} · {m.job_title ?? m.department ?? "—"}</p>
                          </div>
                          <button
                            title="Remove member"
                            onClick={() => setRemoveMemberId(m.id)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <UserMinus size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add member */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-3">Add Member</p>
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <EmployeePicker
                      label=""
                      employees={availableEmployees}
                      value={pickedMember}
                      onChange={setPickedMember}
                      placeholder="Search employees…"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      leftIcon={<UserPlus size={13} />}
                      disabled={addMember.isPending || !pickedMember}
                    >
                      {addMember.isPending ? "Adding…" : "Add to Group"}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!showNewGroupForm && !selectedGroup && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-brand-text-secondary py-16">
                <Users2 size={32} className="text-gray-300" />
                <p className="text-sm">Select a group to manage its members,</p>
                <p className="text-sm">or create a new one.</p>
                <Button
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setShowNewGroupForm(true)}
                >
                  New Group
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removeMemberId}
        title="Remove Member"
        message="Remove this person from the group? They will no longer be available as an approver for steps using this group."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveMemberId(null)}
      />
    </AppLayout>
  );
}
