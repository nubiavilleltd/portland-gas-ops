"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  PowerOff,
  Power,
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useCustomerById } from "@/lib/modules/customers/hooks/useCustomers";
import { CustomersService } from "@/lib/modules/customers/services/customers.service";
import { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";
import { parseError } from "@/lib/errors";
import { formatDate } from "@/lib/utils";

// ── Detail row ────────────────────────────────────────────
function DetailRow({
  icon,
  label,
  value,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-brand-border last:border-0">
      <div className="mt-0.5 text-brand-text-secondary shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium text-brand-text-secondary uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-brand-text-primary mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const { customer, isLoading, error } = useCustomerById(id);
  const [isToggling, setIsToggling]    = useState(false);

  const isActive = customer?.status === "active"

  // ── Loading skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout pageTitle="Customer">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // ── Not found ─────────────────────────────────────────
  if (error || !customer) {
    return (
      <AppLayout pageTitle="Customer Not Found">
        <ErrorBanner message={error ?? "This customer could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(CUSTOMER_ROUTES.list())}
        >
          Back to Customers
        </Button>
      </AppLayout>
    );
  }

  // ── Handlers — defined after guards so customer is guaranteed ──
  async function handleToggleStatus() {
    setIsToggling(true);
    try {
      isActive
        ? await CustomersService.deactivateCustomer(id)
        : await CustomersService.activateCustomer(id);
      toast.success(
        isActive
          ? "Customer deactivated"
          : "Customer activated"
      );
      router.push(CUSTOMER_ROUTES.list());
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setIsToggling(false);
    }
  }

  // ── Render ────────────────────────────────────────────
  return (
    <AppLayout pageTitle={customer.name}>
      {/* Back */}
      <button
        onClick={() => router.push(CUSTOMER_ROUTES.list())}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Customers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-text-primary">
            {customer.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={
                customer.type === "corporate"
                  ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              }
            >
              {customer.type === "corporate" ? "Corporate" : "Individual"}
            </span>
            <span className="text-xs text-brand-text-secondary">
              Added {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>

        {/* Action buttons — wrapped in a div so they sit side by side */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            href={CUSTOMER_ROUTES.edit(customer.id)}
            leftIcon={<Pencil size={14} />}
          >
            Edit
          </Button>
          <Button
            variant={isActive ? "danger" : "primary"}
            loading={isToggling}
            loadingText={isActive ? "Deactivating…" : "Activating…"}
            onClick={handleToggleStatus}
            leftIcon={
              isActive
                ? <PowerOff size={14} />
                : <Power size={14} />
            }
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <DetailRow
          icon={
            customer.type === "corporate"
              ? <Building2 size={16} />
              : <User size={16} />
          }
          label="Type"
          value={customer.type === "corporate" ? "Corporate" : "Individual"}
        />
        <DetailRow
          icon={<Phone size={16} />}
          label="Phone"
          value={customer.phone}
        />
        <DetailRow
          icon={<Mail size={16} />}
          label="Email"
          value={customer.email}
        />
        <DetailRow
          icon={<MapPin size={16} />}
          label="Address"
          value={customer.address}
        />
      </div>
    </AppLayout>
  );
}