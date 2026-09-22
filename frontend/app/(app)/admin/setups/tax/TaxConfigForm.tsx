"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/utils";
import {
  useCreateTaxConfig,
  useUpdateTaxConfig,
  type TaxBand,
  type TaxConfig,
} from "@/lib/modules/hr/tax-config";

/**
 * Rates are entered as percentages because that is how they are published;
 * they are stored as fractions. Bands are entered as widths ("the next
 * 300,000"), again matching the published form, with the last band left blank
 * to mean "everything above".
 */

interface BandRow {
  width: string;
  rate: string;
}

function toBandRows(bands: TaxBand[]): BandRow[] {
  if (bands.length === 0) return [{ width: "", rate: "" }];
  return bands.map((b) => ({
    width: b.width == null ? "" : String(b.width),
    rate: String(Number(b.rate) * 100),
  }));
}

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Running preview of the cumulative thresholds, so whoever is entering the
 * widths can check them against the published table as they type.
 */
function withThresholds(rows: BandRow[]) {
  let lower = 0;
  return rows.map((b) => {
    const from = lower;
    const to = b.width === "" ? null : lower + num(b.width);
    lower = to ?? lower;
    return { b, from, to };
  });
}

export default function TaxConfigForm({
  config,
  onClose,
}: {
  config: TaxConfig | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const create = useCreateTaxConfig();
  const update = useUpdateTaxConfig();
  const saving = create.isPending || update.isPending;

  const [name, setName] = useState(config?.name ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(
    config?.effective_from ?? new Date().toISOString().slice(0, 10),
  );
  const [isActive, setIsActive] = useState(config?.is_active ?? true);
  const [notes, setNotes] = useState(config?.notes ?? "");

  const [pensionRate, setPensionRate] = useState(String((config?.pension_rate ?? 0.08) * 100));
  const [pBasic, setPBasic] = useState(config?.pension_includes_basic ?? true);
  const [pHousing, setPHousing] = useState(config?.pension_includes_housing ?? true);
  const [pTransport, setPTransport] = useState(config?.pension_includes_transport ?? true);
  const [pMeal, setPMeal] = useState(config?.pension_includes_meal ?? false);

  const [nhfRate, setNhfRate] = useState(String((config?.nhf_rate ?? 0.025) * 100));
  const [nBasic, setNBasic] = useState(config?.nhf_includes_basic ?? true);
  const [nHousing, setNHousing] = useState(config?.nhf_includes_housing ?? false);
  const [nTransport, setNTransport] = useState(config?.nhf_includes_transport ?? false);
  const [nMeal, setNMeal] = useState(config?.nhf_includes_meal ?? false);

  const [craMin, setCraMin] = useState(String(config?.cra_minimum ?? 200000));
  const [craPct, setCraPct] = useState(String((config?.cra_gross_percent ?? 0.01) * 100));
  const [craAdd, setCraAdd] = useState(String((config?.cra_additional_percent ?? 0.2) * 100));

  const [bands, setBands] = useState<BandRow[]>(toBandRows(config?.bands ?? []));

  function setBand(i: number, patch: Partial<BandRow>) {
    setBands((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Give the configuration a name");
      return;
    }
    const filled = bands.filter((b) => b.rate !== "");
    if (filled.length === 0) {
      toast.error("Add at least one PAYE band");
      return;
    }
    // Only the last band may be open-ended, otherwise income above it would
    // silently fall out of the calculation.
    const openEnded = filled.findIndex((b) => b.width === "");
    if (openEnded !== -1 && openEnded !== filled.length - 1) {
      toast.error("Only the last band can be left open-ended");
      return;
    }

    const body = {
      name: name.trim(),
      effective_from: effectiveFrom,
      is_active: isActive,
      notes: notes.trim() || null,
      pension_rate: num(pensionRate) / 100,
      pension_includes_basic: pBasic,
      pension_includes_housing: pHousing,
      pension_includes_transport: pTransport,
      pension_includes_meal: pMeal,
      nhf_rate: num(nhfRate) / 100,
      nhf_includes_basic: nBasic,
      nhf_includes_housing: nHousing,
      nhf_includes_transport: nTransport,
      nhf_includes_meal: nMeal,
      cra_minimum: num(craMin),
      cra_gross_percent: num(craPct) / 100,
      cra_additional_percent: num(craAdd) / 100,
      bands: filled.map((b, i) => ({
        sequence: i + 1,
        width: b.width === "" ? null : num(b.width),
        rate: num(b.rate) / 100,
      })),
    };

    try {
      if (config && config.id) {
        await update.mutateAsync({ id: config.id, body });
        toast.success("Tax configuration updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Tax configuration created");
      }
      onClose();
    } catch {
      toast.error("Could not save the configuration");
    }
  }

  if (typeof document === "undefined") return null;

  const bandRows = withThresholds(bands);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="w-full max-w-3xl my-8 rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="text-base font-semibold text-brand-text-primary">
            {config?.id ? "Edit tax configuration" : "New tax configuration"}
          </h2>
          <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary">
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nigeria PAYE — 2026"
            />
            <FormInput
              label="Effective from"
              type="date"
              required
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              hint="Applies to payroll periods on or after this date"
            />
          </div>

          <FormTextarea
            label="Notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Source of these rates, who confirmed them, and when"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active — payroll may use this configuration
          </label>

          {/* PAYE bands */}
          <section>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-1">PAYE bands</h3>
            <p className="text-xs text-brand-text-secondary mb-3">
              Enter each band&apos;s width on annual taxable income, as published
              (&ldquo;the next 300,000 at 11%&rdquo;). Leave the last width blank to mean
              everything above.
            </p>
            <div className="space-y-2">
              {bandRows.map(({ b, from, to }, i) => {
                return (
                  <div key={i} className="flex items-end gap-2">
                    <div className="w-40">
                      <FormInput
                        label={i === 0 ? "Width" : ""}
                        value={b.width}
                        onChange={(e) => setBand(i, { width: e.target.value })}
                        placeholder="300000"
                      />
                    </div>
                    <div className="w-28">
                      <FormInput
                        label={i === 0 ? "Rate %" : ""}
                        value={b.rate}
                        onChange={(e) => setBand(i, { rate: e.target.value })}
                        placeholder="7"
                      />
                    </div>
                    <p className="flex-1 pb-2.5 text-xs text-brand-text-secondary tabular-nums">
                      {to == null
                        ? `Above ${formatCurrency(from)}`
                        : `${formatCurrency(from)} – ${formatCurrency(to)}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBands((r) => r.filter((_, idx) => idx !== i))}
                      disabled={bands.length === 1}
                      className="pb-2.5 text-brand-text-secondary hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              leftIcon={<Plus size={14} />}
              onClick={() => setBands((r) => [...r, { width: "", rate: "" }])}
            >
              Add band
            </Button>
          </section>

          {/* Contributions */}
          <section className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Pension</h3>
              <FormInput
                label="Employee rate %"
                value={pensionRate}
                onChange={(e) => setPensionRate(e.target.value)}
              />
              <p className="text-xs text-brand-text-secondary mt-3 mb-1">Applied to</p>
              {[
                ["Basic", pBasic, setPBasic],
                ["Housing", pHousing, setPHousing],
                ["Transport", pTransport, setPTransport],
                ["Meal", pMeal, setPMeal],
              ].map(([label, val, setter]) => (
                <label key={label as string} className="flex items-center gap-2 text-sm py-0.5">
                  <input
                    type="checkbox"
                    checked={val as boolean}
                    onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                  />
                  {label as string}
                </label>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-brand-text-primary mb-2">NHF</h3>
              <FormInput label="Rate %" value={nhfRate} onChange={(e) => setNhfRate(e.target.value)} />
              <p className="text-xs text-brand-text-secondary mt-3 mb-1">Applied to</p>
              {[
                ["Basic", nBasic, setNBasic],
                ["Housing", nHousing, setNHousing],
                ["Transport", nTransport, setNTransport],
                ["Meal", nMeal, setNMeal],
              ].map(([label, val, setter]) => (
                <label key={label as string} className="flex items-center gap-2 text-sm py-0.5">
                  <input
                    type="checkbox"
                    checked={val as boolean}
                    onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                  />
                  {label as string}
                </label>
              ))}
            </div>
          </section>

          {/* Consolidated relief */}
          <section>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-1">
              Consolidated relief allowance
            </h3>
            <p className="text-xs text-brand-text-secondary mb-3">
              higher of the minimum or a percentage of gross, plus a further percentage of gross
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormInput label="Minimum" value={craMin} onChange={(e) => setCraMin(e.target.value)} />
              <FormInput label="% of gross" value={craPct} onChange={(e) => setCraPct(e.target.value)} />
              <FormInput label="Additional % of gross" value={craAdd} onChange={(e) => setCraAdd(e.target.value)} />
            </div>
          </section>
        </div>

        <footer className="flex justify-end gap-2 border-t border-brand-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} loadingText="Saving...">
            {config?.id ? "Save changes" : "Create configuration"}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
