import Link from "next/link";
import { Eye, Download, Trash2 } from "lucide-react";
import type { Column } from "@/components/data-table/data-table";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { formatDate } from "@/lib/utils";
import type { Employee, EmployeeRecord, LeaveRequest, PaySlip, PayrollRun } from "./_data";

const fmt  = (n: number) => (n === 0 ? "—" : `₦${n.toLocaleString("en-NG")}`);
const fmtN = (v: unknown) => (v === undefined || v === null || v === "" ? "—" : fmt(Number(v)));

export function createEmployeeColumns(
  onDelete: (id: string) => void,
): Column<Employee>[] {
  return [
    {
      key: "firstName",
      label: "First Name",
      sortable: true,
      render: (v) => <span className="font-medium text-brand-text-primary">{String(v)}</span>,
    },
    {
      key: "lastName",
      label: "Last Name",
      sortable: true,
      render: (v) => <span className="font-medium text-brand-text-primary">{String(v)}</span>,
    },
    { key: "title", label: "Title", sortable: true },
    { key: "department", label: "Department", sortable: true },
    {
      key: "birthday",
      label: "Birthday",
      sortable: true,
      render: (v) => (
        <span className="text-brand-text-secondary whitespace-nowrap">
          {v ? formatDate(String(v)) : "—"}
        </span>
      ),
    },
    { key: "category", label: "Category", sortable: true },
    { key: "grade", label: "Grade", sortable: true },
    {
      key: "lineManager",
      label: "Line Manager",
      sortable: true,
      render: (v) => <span className="text-brand-text-primary">{v ? String(v) : "—"}</span>,
    },
    {
      key: "lineManagerEmail",
      label: "Line Manager Email",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary text-xs">{v ? String(v) : "—"}</span>,
    },
    {
      key: "basicSalary",
      label: "Basic Salary",
      sortable: true,
      render: (v) => <span className="font-medium text-brand-text-primary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "housingAllowance",
      label: "Housing Allowance",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "transportAllowance",
      label: "Transport Allowance",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "mealAllowance",
      label: "Meal Allowance",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "paye",
      label: "PAYE Tax",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "pension",
      label: "Pension",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "nhf",
      label: "NHF",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "loanRepayment",
      label: "Loan Repayment",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{fmtN(v)}</span>,
    },
    {
      key: "id",
      label: "",
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/employees/${row.id}`}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition"
            title="View Profile"
          >
            <Eye size={14} />
          </Link>
          <button
            onClick={() => onDelete(row.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];
}

export function createEmployeeRecordColumns(
  onDelete: (id: string) => void,
): Column<EmployeeRecord>[] {
  return [
    {
      key: "employee",
      label: "Employee",
      sortable: true,
      render: (v) => <span className="font-medium text-brand-text-primary">{String(v)}</span>,
    },
    { key: "docType", label: "Document Type", sortable: true },
    {
      key: "fileName",
      label: "File Name",
      sortable: true,
      render: (v) => <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>,
    },
    {
      key: "uploadDate",
      label: "Upload Date",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary whitespace-nowrap">{String(v)}</span>,
    },
    {
      key: "uploadedBy",
      label: "Uploaded By",
      sortable: true,
      render: (v) => <span className="text-brand-text-secondary">{String(v)}</span>,
    },
    {
      key: "id",
      label: "",
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition"
            title="View"
            onClick={() => row.filePath && window.open(row.filePath, "_blank")}
            disabled={!row.filePath}
          >
            <Eye size={14} />
          </button>
          <a
            href={row.filePath ?? "#"}
            download={row.fileName}
            className={`p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition ${!row.filePath ? "pointer-events-none opacity-40" : ""}`}
            title="Download"
            onClick={(e) => !row.filePath && e.preventDefault()}
          >
            <Download size={14} />
          </a>
          <button onClick={() => onDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];
}

export function createPaySlipColumns(
  onView: (slip: PaySlip) => void,
): Column<PaySlip>[] {
  return [
    {
      key: "employee",
      label: "Employee",
      sortable: true,
      render: (v) => <span className="font-medium text-brand-text-primary">{String(v)}</span>,
    },
    {
      key: "empId",
      label: "Employee ID",
      sortable: true,
      render: (v) => <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>,
    },
    { key: "department", label: "Department", sortable: true },
    { key: "period", label: "Period", sortable: true },
    {
      key: "basic",
      label: "Basic",
      sortable: true,
      render: (v) => <span className="font-semibold text-brand-text-primary">{fmt(Number(v))}</span>,
    },
    {
      key: "net",
      label: "Net Pay",
      sortable: true,
      render: (v) => <span className="font-bold text-brand-purple">{fmt(Number(v))}</span>,
    },
    {
      key: "id",
      label: "",
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-brand-text-secondary hover:bg-gray-200 transition"
          >
            <Eye size={12} /> View
          </button>
        </div>
      ),
    },
  ];
}

export const leaveRequestColumns: Column<LeaveRequest>[] = [
  {
    key: "ref",
    label: "Reference",
    sortable: true,
    render: (v) => <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>,
  },
  {
    key: "employee",
    label: "Employee",
    sortable: true,
    render: (v) => <span className="font-medium text-brand-text-primary">{String(v)}</span>,
  },
  {
    key: "requester",
    label: "Requester",
    sortable: true,
    render: (v, row) => (
      <span className="text-brand-text-secondary">{v ? String(v) : row.employee}</span>
    ),
  },
  { key: "type", label: "Leave Type", sortable: true },
  {
    key: "requestType",
    label: "Request Type",
    sortable: true,
    render: (v) => (
      <span className="capitalize text-brand-text-secondary">{v ? String(v) : "—"}</span>
    ),
  },
  { key: "department", label: "Department", sortable: true },
  {
    key: "date",
    label: "Request Date",
    sortable: true,
    render: (v) => (
      <span className="text-brand-text-secondary whitespace-nowrap">{String(v)}</span>
    ),
  },
  {
    key: "days",
    label: "Days",
    sortable: true,
    render: (v) => <span className="font-semibold">{String(v)}</span>,
  },
  {
    key: "startDate",
    label: "Start Date",
    sortable: true,
    render: (v) => (
      <span className="text-brand-text-secondary whitespace-nowrap">{formatDate(String(v))}</span>
    ),
  },
  {
    key: "endDate",
    label: "End Date",
    sortable: true,
    render: (v) => (
      <span className="text-brand-text-secondary whitespace-nowrap">{formatDate(String(v))}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
];

export const payrollColumns: Column<PayrollRun>[] = [
  {
    key: "ref",
    label: "Reference",
    sortable: true,
    render: (v) => <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>,
  },
  {
    key: "period",
    label: "Period",
    sortable: true,
    render: (v) => <span className="font-medium text-brand-text-primary">{String(v)}</span>,
  },
  {
    key: "runDate",
    label: "Run Date",
    sortable: true,
    render: (v) => <span className="text-brand-text-secondary">{String(v)}</span>,
  },
  { key: "employees", label: "Employees", sortable: true },
  {
    key: "totalGross",
    label: "Total Gross",
    sortable: true,
    render: (v) => <span className="font-semibold">{fmt(Number(v))}</span>,
  },
  {
    key: "totalNet",
    label: "Total Net",
    sortable: true,
    render: (v) => <span className="font-bold text-brand-purple">{fmt(Number(v))}</span>,
  },
  {
    key: "preparedBy",
    label: "Prepared By",
    sortable: true,
    render: (v) => <span className="text-brand-text-secondary">{String(v)}</span>,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
];
