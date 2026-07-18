"use client";

export type AuditTrailItem = {
  action: string;
  actor: string;
  role: string;
  dateTime: string;
  comment: string;
};

type Props = {
  items: AuditTrailItem[];
  title?: string;
  description?: string;
  emptyMessage?: string;
};

export default function AuditTrail({
  items,
  title = "Audit Trail",
  description = "Recorded workflow actions and comments for this request.",
  emptyMessage = "No audit actions yet.",
}: Props) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-brand-text-secondary">{description}</p>
        ) : null}
      </div>
      <div className="p-5 md:p-6">
        {items.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-gray-50">
                <tr className="border-b border-brand-border">
                  {["Action", "Actor", "Role", "Date/Time", "Comment"].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase text-brand-text-secondary"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-white">
                {items.map((item, index) => (
                  <tr key={`${item.action}-${index}`}>
                    <AuditValue value={item.action} />
                    <AuditValue value={item.actor} />
                    <AuditValue value={item.role} />
                    <AuditValue value={item.dateTime} className="whitespace-nowrap" />
                    <AuditValue value={item.comment} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function AuditValue({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 align-top text-sm text-brand-text-primary ${className}`}>
      {value || "-"}
    </td>
  );
}
