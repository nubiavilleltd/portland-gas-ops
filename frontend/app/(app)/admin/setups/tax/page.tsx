"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, AlertTriangle, Info, Copy } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { BackButton } from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useTaxConfigs,
  useDeleteTaxConfig,
  type TaxConfig,
} from "@/lib/modules/hr/tax-config";
import TaxConfigForm from "./TaxConfigForm";

/**
 * Tax & statutory deductions.
 *
 * Rules live here as data rather than in code. Payroll resolves the config in
 * force for the period it is running, so adding a new effective-dated config
 * never rewrites payslips that were produced under the old rates.
 */

function pct(fraction: number) {
  return `${(Number(fraction) * 100).toFixed(2).replace(/\.00$/, "")}%`;
}

/** Widths are published as band sizes; readers want cumulative thresholds. */
function withThresholds<T extends { width: number | null }>(bands: T[]) {
  let lower = 0;
  return bands.map((b) => {
    const from = lower;
    const to = b.width == null ? null : lower + Number(b.width);
    lower = to ?? lower;
    return { band: b, from, to };
  });
}

function BandTable({ config }: { config: TaxConfig }) {
  const rows = withThresholds(config.bands);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-brand-text-secondary">
          <th className="text-left font-medium py-1.5">Annual taxable income</th>
          <th className="text-right font-medium py-1.5">Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ band, from, to }) => (
          <tr key={band.sequence} className="border-t border-brand-border">
            <td className="py-1.5 tabular-nums">
              {to == null
                ? `Above ${formatCurrency(from)}`
                : `${formatCurrency(from)} – ${formatCurrency(to)}`}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium">{pct(band.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TaxSetupPage() {
  const toast = useToast();
  const { data: configs = [], isLoading } = useTaxConfigs();
  const remove = useDeleteTaxConfig();

  const [editing, setEditing] = useState<TaxConfig | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TaxConfig | null>(null);

  // The one payroll would use today: newest active config already in effect.
  const today = new Date().toISOString().slice(0, 10);
  const inForce = configs.find((c) => c.is_active && c.effective_from <= today);

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success("Tax configuration deleted");
      setConfirmDelete(null);
    } catch {
      toast.error("Could not delete that configuration");
    }
  }

  return (
    <AppLayout pageTitle="Tax & Statutory Deductions">
      <BackButton href="/admin" label="Admin" />

      <PageHeader
        title="Tax & Statutory Deductions"
        description="PAYE bands, pension and NHF rates that payroll applies"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => setEditing("new")}>
            New configuration
          </Button>
        }
        className="mb-6"
      />

      <details className="rounded-2xl border border-brand-border bg-white p-5 mb-4 group" open>
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-text-primary">
          <Info size={16} className="text-brand-purple" />
          How these configurations work
        </summary>

        <div className="mt-4 grid gap-5 md:grid-cols-2 text-sm text-brand-text-secondary">
          <div>
            <p className="font-medium text-brand-text-primary mb-1">
              Payroll reads these rules — nothing is typed per employee
            </p>
            <p>
              When payroll runs, it looks up the configuration that was in force
              for <em>that period</em> and calculates PAYE, pension and NHF from
              each employee&apos;s basic, housing, transport and meal figures.
              Deductions are never entered by hand, so they cannot be missed.
            </p>
          </div>

          <div>
            <p className="font-medium text-brand-text-primary mb-1">
              Effective dates keep history intact
            </p>
            <p>
              A configuration applies to every period on or after its effective
              date, until a newer one takes over. Adding a 2027 configuration
              leaves 2026 payslips calculating on 2026 rules. That is why you
              should <strong>add</strong> a configuration when rates change
              rather than editing an existing one.
            </p>
          </div>

          <div>
            <p className="font-medium text-brand-text-primary mb-1">The order of the calculation</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Pension and NHF come off gross first</li>
              <li>Then consolidated relief</li>
              <li>What remains is taxable income</li>
              <li>The bands are applied to it, in order</li>
            </ol>
            <p className="mt-1">
              The sequence matters — swapping steps quietly changes everyone&apos;s tax.
            </p>
          </div>

          <div>
            <p className="font-medium text-brand-text-primary mb-1">Entering the bands</p>
            <p>
              Bands are entered as <strong>widths</strong>, the way rates are
              published — &ldquo;the next 300,000 at 11%&rdquo;. The cumulative
              ranges are worked out for you as you type. Leave the{" "}
              <strong>last</strong> band&apos;s width blank so it covers
              everything above; otherwise high earners&apos; income would fall
              outside the table untaxed.
            </p>
          </div>
        </div>
      </details>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-medium">Add a new configuration when rates change — do not edit an old one.</p>
          <p className="mt-0.5 text-amber-800">
            Payroll uses the configuration in force for the period it is running.
            Editing a past configuration changes what historical payslips would
            recalculate to.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : configs.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-white p-8 text-center">
          <p className="text-sm text-brand-text-secondary">
            No tax configuration yet. Payroll cannot calculate deductions until one exists.
          </p>
          <Button className="mt-4" leftIcon={<Plus size={16} />} onClick={() => setEditing("new")}>
            Create the first configuration
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map((c) => {
            const active = inForce?.id === c.id;
            return (
              <section
                key={c.id}
                className={`rounded-2xl border bg-white overflow-hidden ${
                  active ? "border-emerald-300" : "border-brand-border"
                }`}
              >
                <header className="px-5 py-4 border-b border-brand-border flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-brand-text-primary">{c.name}</h3>
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                          <Check size={12} />
                          In force
                        </span>
                      )}
                      {!c.is_active && (
                        <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      Effective from {formatDate(c.effective_from)}
                    </p>
                    {c.notes && (
                      <p className="text-xs text-brand-text-secondary mt-1 max-w-2xl">{c.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Copy size={14} />}
                      onClick={() => setEditing({ ...c, id: "", name: `${c.name} (copy)` })}
                    >
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setEditing(c)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setConfirmDelete(c)}>
                      Delete
                    </Button>
                  </div>
                </header>

                <div className="grid gap-5 md:grid-cols-2 p-5">
                  <div>
                    <h4 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
                      PAYE bands
                    </h4>
                    {c.bands.length === 0 ? (
                      <p className="text-sm text-brand-text-secondary">
                        No bands configured — PAYE would compute as zero.
                      </p>
                    ) : (
                      <BandTable config={c} />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
                        Contributions
                      </h4>
                      <dl className="text-sm space-y-1">
                        <div className="flex justify-between gap-4">
                          <dt className="text-brand-text-secondary">Pension</dt>
                          <dd className="tabular-nums text-right">
                            {pct(c.pension_rate)}
                            <span className="block text-xs text-brand-text-secondary">
                              of {[
                                c.pension_includes_basic && "basic",
                                c.pension_includes_housing && "housing",
                                c.pension_includes_transport && "transport",
                                c.pension_includes_meal && "meal",
                              ].filter(Boolean).join(" + ") || "nothing"}
                            </span>
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 pt-1">
                          <dt className="text-brand-text-secondary">NHF</dt>
                          <dd className="tabular-nums text-right">
                            {pct(c.nhf_rate)}
                            <span className="block text-xs text-brand-text-secondary">
                              of {[
                                c.nhf_includes_basic && "basic",
                                c.nhf_includes_housing && "housing",
                                c.nhf_includes_transport && "transport",
                                c.nhf_includes_meal && "meal",
                              ].filter(Boolean).join(" + ") || "nothing"}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
                        Consolidated relief
                      </h4>
                      <p className="text-sm text-brand-text-primary">
                        higher of {formatCurrency(c.cra_minimum)} or {pct(c.cra_gross_percent)} of gross,
                        plus {pct(c.cra_additional_percent)} of gross
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <TaxConfigForm
          config={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this tax configuration?"
        message={
          confirmDelete
            ? `"${confirmDelete.name}" will be removed. Any period that resolved to it will fall back to an earlier configuration.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  );
}
