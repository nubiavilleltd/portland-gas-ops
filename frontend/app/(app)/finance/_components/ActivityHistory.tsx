import { APPROVERS } from "./_data";

interface Props {
  initiator: string;
  department: string;
  submittedAt: Date;
}

export default function ActivityHistory({ initiator, department, submittedAt }: Props) {
  const approvers = APPROVERS[department] ?? APPROVERS.Finance;

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-purple">
          Workflow Activity History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-brand-border text-left">
              {["Name", "Action / Status", "Date", "Comment", "Next Approver"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-5 py-4 font-medium text-brand-purple">
                {initiator}
                <span className="block text-xs text-brand-text-secondary font-normal">(Initiator)</span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Submitted
                </span>
              </td>
              <td className="px-5 py-4 text-brand-text-secondary whitespace-nowrap">{fmt(submittedAt)}</td>
              <td className="px-5 py-4 text-brand-text-primary">Request submitted — Awaiting Approval</td>
              <td className="px-5 py-4 font-medium text-brand-purple">
                {approvers.lineManager}
                <span className="block text-xs text-brand-text-secondary font-normal">(Line Manager)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
