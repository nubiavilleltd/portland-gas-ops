"use client";

import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";

interface Props {
  requester: {
    name: string;
    department: string;
    role: string;
    requestDate: string;
    desc?: string;
  };
}

export default function RequesterDetailsSection({ requester }: Props) {
  return (
    <FormSection
      title="Record Information"
      description={
        requester.desc
          ? requester.desc
          : "Information about the user who created this onboarding record."
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Created By" value={requester.name} disabled />

        <FormInput label="Department" value={requester.department} disabled />

        <FormInput label="Job Title / Role" value={requester.role} disabled />

        <FormInput
          label="Date Created"
          value={requester.requestDate}
          disabled
        />
      </div>
    </FormSection>
  );
}
