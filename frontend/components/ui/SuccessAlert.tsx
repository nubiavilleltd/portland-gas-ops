import { CheckCircle2 } from "lucide-react";

interface SuccessAlertProps {
  title: string;
  message?: string;
  reference?: string;
}

export default function SuccessAlert({ title, message, reference }: SuccessAlertProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
      <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
      <div>
        <h2 className="font-semibold text-green-800">{title}</h2>
        {message && (
          <p className="text-sm text-green-700 mt-0.5">{message}</p>
        )}
        {reference && (
          <p className="text-sm text-green-700 mt-0.5">
            Reference: <span className="font-mono font-bold">{reference}</span>
          </p>
        )}
      </div>
    </div>
  );
}
