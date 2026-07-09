"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil, PowerOff, Power, ArrowLeft } from "lucide-react";
import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useProductById } from "@/lib/modules/products/hooks/useProducts";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { parseError } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

// ── Small detail row ──────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 py-4 border-b border-brand-border last:border-0">
            <p className="text-xs font-medium text-brand-text-secondary uppercase tracking-wide">
                {label}
            </p>
            <p className="text-sm text-brand-text-primary">{value}</p>
        </div>
    );
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { product, isLoading, error } = useProductById(id);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    const isActive = product?.status == "active"

    if (isLoading) {
        return (
            <AppLayout pageTitle="Product">
                <div className="animate-pulse space-y-4 max-w-2xl">
                    <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                </div>
            </AppLayout>
        );
    }

    if (error || !product) {
        return (
            <AppLayout pageTitle="Product Not Found">
                <ErrorBanner message={error ?? "This product could not be found."} />
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push(PRODUCT_ROUTES.list())}
                >
                    Back to Products
                </Button>
            </AppLayout>
        );
    }

    async function handleToggleStatus() {
        if (!product) return;
        setIsToggling(true);
        setActionError(null);
        try {
            const updated = product.status === "active"
                ? await ProductsService.deactivateProduct(product.id)
                : await ProductsService.activateProduct(product.id);
            toast.success(`${updated.name} is now ${updated.status}`);
            // Refresh by navigating back to list — refetch will pick up the change
            router.push(PRODUCT_ROUTES.list());
        } catch (err) {
            setActionError(parseError(err));
        } finally {
            setIsToggling(false);
        }
    }

    //   const unitLabel = getUnitLabel(product);

    return (
        <AppLayout pageTitle={product.name}>
            {/* Back */}
            <button
                onClick={() => router.push(PRODUCT_ROUTES.list())}
                className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
            >
                <ArrowLeft size={14} />
                Back to Products
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-brand-text-primary">
                        {product.name}
                    </h1>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        Added {formatDate(product.createdAt)}
                    </p>
                </div>

                {/* These actions are not meant for users anymore */}

                {/* <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        href={PRODUCT_ROUTES.edit(product.id)}
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
                </div> */}
            </div>

            <ErrorBanner message={actionError} className="mb-4" />

            {/* Details card */}
            <div className="bg-white border border-brand-border rounded-2xl p-6">
                <DetailRow
                    label="Status"
                    value={
                        <span
                            className={
                                isActive
                                    ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
                                    : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
                            }
                        >
                            {isActive ? "Active" : "Inactive"}
                        </span>
                    }
                />
                <DetailRow label="Unit of Measurement" value={product.unit} />
                <DetailRow
                    label="Default Unit Price"
                    value={`${formatCurrency(product.defaultUnitPrice)} / ${product.unit}`}
                />
                <DetailRow
                    label="Description"
                    value={product.description ?? "—"}
                />
            </div>
        </AppLayout>
    );
}