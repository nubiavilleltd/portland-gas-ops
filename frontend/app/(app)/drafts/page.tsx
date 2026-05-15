"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function DraftsPage() {
  return (
    <AppLayout pageTitle="Drafts">
      <PageHeader
        title="Drafts"
        description="Continue unfinished requests and documents from one place."
        className="mb-6"
      />
      <div className="rounded-2xl border border-brand-border bg-white">
        <EmptyState
          title="No drafts yet"
          description="Saved drafts across procurement, orders, HR, and other modules will appear here."
        />
      </div>
    </AppLayout>
  );
}
