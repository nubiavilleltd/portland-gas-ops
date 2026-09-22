"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api";

/**
 * Statutory deduction rules — PAYE bands, pension, NHF, consolidated relief.
 *
 * Versioned by effective date: payroll resolves the config in force for the
 * period being run, so changing next year's rates never rewrites last year's
 * payslips. Add a new config rather than editing an old one.
 */

export interface TaxBand {
  id?: string;
  sequence: number;
  /** Band width — "the next 300,000". null means the remainder (top band). */
  width: number | null;
  /** Fraction, not a percentage: 0.07 is 7%. */
  rate: number;
}

export interface TaxConfig {
  id: string;
  name: string;
  effective_from: string;
  is_active: boolean;
  notes: string | null;

  pension_rate: number;
  pension_includes_basic: boolean;
  pension_includes_housing: boolean;
  pension_includes_transport: boolean;
  pension_includes_meal: boolean;

  nhf_rate: number;
  nhf_includes_basic: boolean;
  nhf_includes_housing: boolean;
  nhf_includes_transport: boolean;
  nhf_includes_meal: boolean;

  cra_minimum: number;
  cra_gross_percent: number;
  cra_additional_percent: number;

  bands: TaxBand[];
}

export type TaxConfigInput = Omit<TaxConfig, "id" | "bands"> & { bands: TaxBand[] };

const KEY = ["tax-configs"];

export function useTaxConfigs() {
  return useQuery<TaxConfig[]>({
    queryKey: KEY,
    queryFn: () => get<TaxConfig[]>("/api/hr/tax-configs"),
    staleTime: 60 * 1000,
  });
}

/** The config payroll would apply on a date — defaults to today. */
export function useEffectiveTaxConfig(onDate?: string) {
  return useQuery<TaxConfig | null>({
    queryKey: ["tax-configs", "effective", onDate ?? "today"],
    queryFn: () =>
      get<TaxConfig | null>(
        "/api/hr/tax-configs/effective",
        onDate ? { on_date: onDate } : undefined,
      ),
    staleTime: 60 * 1000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateTaxConfig() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: Partial<TaxConfigInput>) => post<TaxConfig>("/api/hr/tax-configs", body),
    onSuccess: invalidate,
  });
}

export function useUpdateTaxConfig() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TaxConfigInput> }) =>
      patch<TaxConfig>(`/api/hr/tax-configs/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteTaxConfig() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => del(`/api/hr/tax-configs/${id}`),
    onSuccess: invalidate,
  });
}

export interface DeductionPreview {
  configured: boolean;
  detail?: string;
  config_name?: string;
  paye: number;
  pension: number;
  nhf: number;
  annual_gross?: number;
  consolidated_relief?: number;
  taxable_income?: number;
  annual_tax?: number;
}

/**
 * Deductions for a set of monthly earnings, computed by the server.
 *
 * The rules used to be reimplemented in the browser — twice, in the new and
 * edit employee forms — which meant they applied only when someone saved
 * through those forms, and drifted from whatever payroll did. This asks the
 * one implementation instead.
 */
export function useDeductionPreview(earnings: {
  basic: number;
  housing: number;
  transport: number;
  meal: number;
}) {
  const total = earnings.basic + earnings.housing + earnings.transport + earnings.meal;
  return useQuery<DeductionPreview>({
    queryKey: ["deduction-preview", earnings.basic, earnings.housing, earnings.transport, earnings.meal],
    queryFn: () => post<DeductionPreview>("/api/hr/tax-configs/preview", earnings),
    enabled: total > 0,
    staleTime: 5 * 60 * 1000,
  });
}
