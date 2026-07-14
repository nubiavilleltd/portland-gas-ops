"use client";

import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";

interface Props {
  requester: {
    name: string;
    department: string;
    role: string;
    requestDate: string;
  };
}

export default function RequesterDetailsSection({ requester }: Props) {
  return (
    <FormSection
      title="Requester Details"
      description="Employee information for the requester who raised this request."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Requester Name" value={requester.name} disabled />

        <FormInput label="Department" value={requester.department} disabled />

        <FormInput label="Job Title / Role" value={requester.role} disabled />

        <FormInput
          label="Request Date"
          value={requester.requestDate}
          disabled
        />
      </div>
    </FormSection>
  );
}
