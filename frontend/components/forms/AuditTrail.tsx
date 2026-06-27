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
          <div className="divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
            {items.map((item, index) => (
              <div
                key={`${item.action}-${index}`}
                className="grid gap-2 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_1.2fr_2fr]"
              >
                <AuditCell label="Action" value={item.action} />
                <AuditCell label="Actor" value={item.actor} />
                <AuditCell label="Role" value={item.role} />
                <AuditCell label="Date/Time" value={item.dateTime} />
                <AuditCell label="Comment" value={item.comment} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AuditCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm text-brand-text-primary">{value || "-"}</p>
    </div>
  );
}
