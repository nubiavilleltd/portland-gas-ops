"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function MyFilesPage() {
  return (
    <AppLayout pageTitle="My Files">
      <PageHeader
        title="My Files"
        description="Keep track of attachments, uploads, and shared documents."
        className="mb-6"
      />
      <div className="rounded-2xl border border-brand-border bg-white">
        <EmptyState
          title="No files yet"
          description="Uploaded files and shared workflow documents will show up here."
        />
      </div>
    </AppLayout>
  );
}
