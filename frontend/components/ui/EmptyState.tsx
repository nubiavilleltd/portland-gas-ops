import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-brand-purple-faint text-brand-purple mb-4">
        <Inbox size={28} />
      </div>
      <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
      {description && (
        <p className="text-sm text-brand-text-secondary mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
