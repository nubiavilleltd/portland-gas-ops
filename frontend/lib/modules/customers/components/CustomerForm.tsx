"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Button from "@/components/ui/Button";

import {
    createCustomerSchema,
    type CreateCustomerFormData,
} from "@/lib/modules/customers/schemas/customer.schema";
import type { Customer, CustomerType } from "@/lib/modules/customers/types/customer.types";

const CUSTOMER_TYPE_OPTIONS: Array<{ value: CustomerType; label: string }> = [
    { value: "corporate", label: "Corporate" },
    { value: "individual", label: "Individual" },
];

interface CustomerFormProps {
    initial?: Customer;
    onSubmit: (data: CreateCustomerFormData) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
    submitLoadingLabel?: string;
}

export default function CustomerForm({
    initial,
    onSubmit,
    onCancel,
    submitLabel = "Create Customer",
    submitLoadingLabel = "Creating…",
}: CustomerFormProps) {
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateCustomerFormData>({
        resolver: zodResolver(createCustomerSchema),
        mode: "onTouched",
        defaultValues: initial
            ? {
                name: initial.name,
                type: initial.type,
                phone: initial.phone,
                email: initial.email,
                address: initial.address,
            }
            : {
                name: "",
                type: "corporate",
                phone: "",
                email: "",
                address: "",
            },
    });

    async function handleFormSubmit(data: CreateCustomerFormData) {
        try {
            await onSubmit(data);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "An unexpected error occurred.";
            setError("root", { message });
            throw err;
        }
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput
                    label="Customer Name"
                    required
                    placeholder="e.g. MTN Nigeria"
                    error={errors.name?.message}
                    {...register("name")}
                />

                <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                        <FormSelect
                            label="Customer Type"
                            required
                            options={CUSTOMER_TYPE_OPTIONS}
                            value={field.value}
                            onValueChange={(v) => field.onChange(v as CustomerType)}
                            error={errors.type?.message}
                        />
                    )}
                />

                <FormInput
                    label="Phone Number"
                    type="tel"
                    required
                    placeholder="e.g. 08012345678"
                    error={errors.phone?.message}
                    {...register("phone")}
                />

                <FormInput
                    label="Email Address"
                    type="email"
                    required
                    placeholder="e.g. procurement@company.com"
                    error={errors.email?.message}
                    {...register("email")}
                />
            </div>

            <FormInput
                label="Address"
                required
                placeholder="Street, City, State"
                error={errors.address?.message}
                {...register("address")}
            />

            <ErrorBanner message={errors.root?.message} />

            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    loading={isSubmitting}
                    loadingText={submitLoadingLabel}
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}