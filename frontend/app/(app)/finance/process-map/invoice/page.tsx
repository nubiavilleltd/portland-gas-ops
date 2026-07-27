import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import InvoiceProcessMap from "../../_components/InvoiceProcessMap";

export default function InvoiceProcessMapPage() {
  return (
    <AppLayout pageTitle="Invoice Processing Process Map">
      <Link
        href="/finance/invoices"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Invoices
      </Link>

      <PageHeader
        title="Invoice Processing"
        description="End-to-end workflow from invoice receipt to vendor payment"
        className="mb-6"
      />

      <InvoiceProcessMap />
    </AppLayout>
  );
}
