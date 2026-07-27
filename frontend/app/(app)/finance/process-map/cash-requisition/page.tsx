import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import CashRequisitionProcessMap from "../../_components/CashRequisitionProcessMap";

export default function CashRequisitionProcessMapPage() {
  return (
    <AppLayout pageTitle="Cash Requisition Process Map">
      <Link
        href="/finance/cash-requisitions"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Cash Requisitions
      </Link>

      <PageHeader
        title="Cash Requisition Process"
        description="End-to-end workflow from request initiation to fund retirement"
        className="mb-6"
      />

      <CashRequisitionProcessMap />
    </AppLayout>
  );
}
