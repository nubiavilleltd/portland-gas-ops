import type { ValidationErrors } from "@/lib/modules/safety/form-validation";

export default function SafetyValidationSummary<Field extends string>({
  errors,
  fieldOrder,
}: {
  errors: ValidationErrors<Field>;
  fieldOrder: Field[];
}) {
  const messages = fieldOrder
    .map((field) => errors[field])
    .filter((message): message is string => Boolean(message));

  if (messages.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-sm font-semibold text-red-800">
        Please correct the highlighted fields.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
        {messages.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
