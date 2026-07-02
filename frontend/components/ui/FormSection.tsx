import { cn } from "@/lib/utils";

interface Props {
  title: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function FormSection({ title, required, description, children, className, bodyClassName }: Props) {
  return (
    <div className={cn("bg-white border border-brand-border rounded-2xl", className)}>
      <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
        <h2 className="text-sm font-semibold text-brand-text-primary">
          {title}{required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {description && (
          <p className="text-xs text-brand-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className={cn("p-6 space-y-5", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
