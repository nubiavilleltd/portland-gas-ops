import { HR_APPROVERS } from "./_data";

interface Props {
  initiator: string;
  department: string;
  reliever: string;
  submittedAt: Date;
  approver3Label?: string;
  status?: string;
}

export default function ActivityHistory({
  initiator,
  department,
  reliever,
  submittedAt,
  approver3Label = "HR Review",
  status = "pending",
}: Props) {
  const ap = HR_APPROVERS[department] ?? HR_APPROVERS.Legal;

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
            <tr className="border-t border-brand-border hover:bg-gray-50/50">
              <td className="px-5 py-4 font-medium text-brand-purple">
                {initiator}
                <span className="block text-xs text-brand-text-secondary font-normal">(Initiator)</span>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                  {config.badge}
                </span>
              </td>
              <td className="px-5 py-4 text-brand-text-secondary whitespace-nowrap">{fmt(submittedAt)}</td>
              <td className="px-5 py-4 text-brand-text-primary">
                {status === "denied" ? "Request denied — No further action" : "Request submitted — Awaiting Approval"}
              </td>
              <td className="px-5 py-4 font-medium text-brand-purple">
                {status === "denied" ? (
                  <>
                    {reliever || "—"}
                    <span className="block text-xs text-brand-text-secondary font-normal">(Reliever)</span>
                  </>
                ) : (reliever || "—")}
                {status !== "denied" && reliever && <span className="block text-xs text-brand-text-secondary font-normal">(Reliever)</span>}
              </td>
            </tr>
            {status === "denied" && (
              <tr className="border-t border-brand-border hover:bg-gray-50/50">
                <td className="px-5 py-4 font-medium text-brand-purple">
                  {reliever || "—"}
                  <span className="block text-xs text-brand-text-secondary font-normal">(Reliever)</span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    Denied
                  </span>
                </td>
                <td className="px-5 py-4 text-brand-text-secondary whitespace-nowrap">{fmt(submittedAt)}</td>
                <td className="px-5 py-4 text-brand-text-secondary">Request rejected</td>
                <td className="px-5 py-4 text-brand-text-secondary">—</td>
              </tr>
            )}
            {status !== "denied" && (
              <>
                <tr className="border-t border-brand-border hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-brand-purple">
                    {reliever || "—"}
                    <span className="block text-xs text-brand-text-secondary font-normal">(Reliever)</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      (status === "approved" || status === "in_progress") ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    } border`}>
                      {(status === "approved" || status === "in_progress") ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-brand-text-secondary">{(status === "approved" || status === "in_progress") ? fmt(submittedAt) : "—"}</td>
                  <td className="px-5 py-4 text-brand-text-secondary">{(status === "approved" || status === "in_progress") ? "Approval confirmed" : "Awaiting review"}</td>
                  <td className="px-5 py-4 font-medium text-brand-purple">
                    {ap.lineManager}
                    <span className="block text-xs text-brand-text-secondary font-normal">(Operations Manager)</span>
                  </td>
                </tr>
                <tr className="border-t border-brand-border hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-brand-purple">
                    {ap.lineManager}
                    <span className="block text-xs text-brand-text-secondary font-normal">(Operations Manager)</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      status === "approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    } border`}>
                      {status === "approved" ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-brand-text-secondary">{status === "approved" ? fmt(submittedAt) : "—"}</td>
                  <td className="px-5 py-4 text-brand-text-secondary">{status === "approved" ? "Approval completed" : "Awaiting review"}</td>
                  <td className="px-5 py-4 font-medium text-brand-purple">
                    {ap.hrReview}
                    <span className="block text-xs text-brand-text-secondary font-normal">({approver3Label})</span>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
