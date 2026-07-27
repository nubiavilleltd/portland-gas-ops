"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, UserX, UserCheck, Mail, Eye, ShieldCheck, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { BackButton } from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/data-table/data-table";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useEmployees,
  useDeactivateEmployee,
  useReactivateEmployee,
  useResendSetup,
  useChangeEmployeeRole,
} from "@/lib/modules/employees/hooks";
import type { EmployeeListItem } from "@/lib/modules/employees/types";
import type { Column } from "@/components/data-table/data-table";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Row = {
  id: string;
  employee_no: string;
  name: string;
  email: string;
  job_title: string;
  department: string;
  employment_type: string;
  account_status: string;
  role: string;
  _emp: EmployeeListItem;
};

function toRow(e: EmployeeListItem): Row {
  return {
    id:              e.id,
    employee_no:     e.employee_no,
    name:            e.user ? `${e.user.first_name ?? ""} ${e.user.last_name ?? ""}`.trim() : "—",
    email:           e.user?.email ?? "",
    job_title:       e.job_title ?? "—",
    department:      e.department ?? "—",
    employment_type: e.employment_type ?? "—",
    account_status:  e.user?.account_status ?? "",
    role:            e.user?.role ?? "staff",
    _emp:            e,
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active")      return <Badge variant="success" label="Active" />;
  if (status === "pending")     return <Badge variant="warning" label="Pending setup" />;
  if (status === "deactivated") return <Badge variant="danger"  label="Deactivated" />;
  return <Badge variant="neutral" label={status} />;
}

function RoleBadge({ role }: { role: string }) {
  const label = role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role.charAt(0).toUpperCase() + role.slice(1);
  const cls = role === "super_admin"
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : role === "admin"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

const ROLE_OPTIONS = [
  { value: "staff",       label: "Staff"       },
  { value: "admin",       label: "Admin"       },
  { value: "super_admin", label: "Super Admin" },
];

// ── Role Change Modal ──────────────────────────────────────────────────────────

function RoleModal({
  row,
  onClose,
}: {
  row: Row;
  onClose: () => void;
}) {
  const toast = useToast();
  const changeRole = useChangeEmployeeRole();
  const [selected, setSelected] = useState(row.role);

  const save = async () => {
    if (selected === row.role) { onClose(); return; }
    await changeRole.mutateAsync({ id: row.id, role: selected });
    toast.success(`${row.name}'s role updated to ${selected}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-brand-text-primary">Change System Role</h3>
            <p className="text-sm text-brand-text-secondary mt-0.5">{row.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-brand-text-secondary">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-brand-text-secondary mb-3">
          This controls what the employee can access in the system.
        </p>

        <div className="space-y-2">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected === opt.value
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-brand-border hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="accent-brand-purple"
              />
              <span className="text-sm font-medium text-brand-text-primary">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <Button onClick={save} loading={changeRole.isPending} className="flex-1">
            Save
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Row Actions ────────────────────────────────────────────────────────────────

function RowActions({
  row,
  isSuperAdmin,
  onChangeRole,
  onDeactivate,
}: {
  row: Row;
  isSuperAdmin: boolean;
  onChangeRole: (row: Row) => void;
  onDeactivate: (row: Row) => void;
}) {
  const toast       = useToast();
  const reactivate  = useReactivateEmployee();
  const resendSetup = useResendSetup();
  const status      = row.account_status;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Link
        href={`/admin/employees/${row.id}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition"
        title="View employee profile"
      >
        <Eye size={14} />
      </Link>

      {isSuperAdmin && (
        <button
          title="Change system role"
          onClick={() => onChangeRole(row)}
          className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition"
        >
          <ShieldCheck size={14} />
        </button>
      )}

      {status === "pending" && (
        <button
          title="Resend setup email"
          onClick={async () => {
            await resendSetup.mutateAsync(row.id);
            toast.success("Setup email resent");
          }}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
        >
          <Mail size={14} />
        </button>
      )}

      {isSuperAdmin && status === "active" && (
        <button
          title="Deactivate account"
          onClick={() => onDeactivate(row)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
        >
          <UserX size={14} />
        </button>
      )}

      {isSuperAdmin && status === "deactivated" && (
        <button
          title="Reactivate account"
          disabled={reactivate.isPending}
          onClick={async () => {
            await reactivate.mutateAsync(row.id);
            toast.success("Account reactivated");
          }}
          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition disabled:opacity-50"
        >
          {reactivate.isPending
            ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            : <UserCheck size={14} />
          }
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const router  = useRouter();
  const toast   = useToast();
  const { data: employees = [], isLoading, error } = useEmployees({ limit: 200 });
  const rows = employees.map(toRow);
  const [roleTarget,       setRoleTarget]       = useState<Row | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Row | null>(null);
  const { user: currentUser } = useCurrentUser();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const deactivate   = useDeactivateEmployee();

  const columns: Column<Row>[] = [
    {
      key: "name",
      label: "NAME",
      sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-medium text-brand-text-primary">{String(v)}</p>
          <p className="text-xs text-brand-text-secondary">{row.email}</p>
        </div>
      ),
    },
    {
      key: "employee_no",
      label: "EMPLOYEE NO",
      sortable: true,
      render: (v) => <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>,
    },
    { key: "job_title",       label: "JOB TITLE",  sortable: true },
    { key: "department",      label: "DEPARTMENT", sortable: true },
    {
      key: "role",
      label: "SYSTEM ROLE",
      sortable: true,
      render: (v) => <RoleBadge role={String(v)} />,
    },
    {
      key: "account_status",
      label: "STATUS",
      sortable: true,
      render: (v) => <StatusBadge status={String(v)} />,
    },
    {
      key: "id",
      label: "",
      render: (_, row) => (
        <RowActions
          row={row}
          isSuperAdmin={isSuperAdmin}
          onChangeRole={setRoleTarget}
          onDeactivate={setDeactivateTarget}
        />
      ),
    },
  ];

  if (error) {
    return (
      <AppLayout pageTitle="Account Management">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-brand-text-secondary">Failed to load accounts.</p>
          <Button variant="outline" leftIcon={<RefreshCw size={14} />} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Account Management">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Account Management"
        description="Create and manage employee system accounts"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => router.push("/admin/accounts/new")}>
            Add Account
          </Button>
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={rows}
        hideStatusFilter
        isLoading={isLoading}
        emptyMessage="No accounts yet"
        emptyDescription="Click 'Add Account' to create the first employee account"
      />

      {roleTarget && (
        <RoleModal row={roleTarget} onClose={() => setRoleTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate account"
        message={`This will prevent ${deactivateTarget?.name ?? "this user"} from logging in. You can reactivate the account at any time.`}
        confirmLabel="Yes, deactivate"
        destructive
        icon={<UserX size={18} />}
        loading={deactivate.isPending}
        onConfirm={async () => {
          if (!deactivateTarget) return;
          await deactivate.mutateAsync(deactivateTarget.id);
          toast.success(`${deactivateTarget.name}'s account has been deactivated`);
          setDeactivateTarget(null);
        }}
        onCancel={() => setDeactivateTarget(null)}
      />
    </AppLayout>
  );
}
