"use client";

import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import type { SafetyChecklistResponse } from "@/lib/modules/safety/checklists";
import SafetyChoiceTable from "./SafetyChoiceTable";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

export default function SafetyChecklistResponsesView({
  responses,
  emptyMessage = "No checklist responses recorded.",
}: {
  responses: SafetyChecklistResponse[];
  emptyMessage?: string;
}) {
  const sortedResponses = [...responses].sort(
    (first, second) =>
      first.sort_order_snapshot - second.sort_order_snapshot ||
      first.label_snapshot.localeCompare(second.label_snapshot),
  );
  const booleanResponses = sortedResponses.filter(
    (response) => response.input_type_snapshot === "boolean",
  );
  const otherResponses = sortedResponses.filter(
    (response) => response.input_type_snapshot !== "boolean",
  );

  if (sortedResponses.length === 0) {
    return <p className="text-sm text-brand-text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {booleanResponses.length > 0 ? (
        <SafetyChoiceTable
          options={yesNoOptions}
          disabled
          rows={booleanResponses.map((response) => ({
            label: response.label_snapshot,
            required: response.is_required_snapshot,
            value: response.value_boolean ? "Yes" : "No",
          }))}
        />
      ) : null}

      {otherResponses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {otherResponses.map((response) =>
            response.input_type_snapshot === "text" ? (
              <FormTextarea
                key={response.id}
                label={response.label_snapshot}
                value={checklistResponseDisplayValue(response)}
                disabled
                className="md:col-span-2"
              />
            ) : (
              <FormInput
                key={response.id}
                label={response.label_snapshot}
                value={checklistResponseDisplayValue(response)}
                disabled
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function checklistResponseDisplayValue(response: SafetyChecklistResponse) {
  if (response.selected_option) {
    return optionLabel(response.selected_option, response.options_json_snapshot);
  }
  if (response.value_text) return response.value_text;
  if (response.value_number) return String(response.value_number);
  if (response.value_date) return response.value_date;
  if (response.value_datetime) return response.value_datetime;
  if (typeof response.value_boolean === "boolean") {
    return response.value_boolean ? "Yes" : "No";
  }
  return "";
}

function optionLabel(
  value: string,
  options?: SafetyChecklistResponse["options_json_snapshot"],
) {
  if (!Array.isArray(options)) return value;

  const option = options.find((current) =>
    typeof current === "string"
      ? current === value
      : current.value === value,
  );

  if (!option) return value;
  return typeof option === "string" ? option : option.label;
}
