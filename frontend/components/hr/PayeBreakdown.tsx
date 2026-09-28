"use client";

import type { DeductionPreview } from "@/lib/modules/hr/tax-config";
import { formatNumber } from "@/lib/utils/format-number";

/**
 * The working behind a live PAYE figure — annual gross down to taxable
 * income, then the band-by-band charge that produces the monthly amount
 * shown above. Collapsed by default so it doesn't crowd the form.
 *
 * Every number here comes straight from whichever tax configuration is
 * currently in force (Setups > Tax & Statutory Deductions), so unlike a
 * written-out formula this can never go stale when rates change — it always
 * shows the calculation that actually ran.
 *
 * Shared by both employee forms so the explanation cannot drift between them
 * the way the old duplicated calculators did.
 */
export default function PayeBreakdown({ preview }: { preview?: DeductionPreview | null }) {
  if (!preview?.configured || preview.taxable_income == null) return null;

  // Only the monthly figures come back from the preview; annualising them
  // here mirrors exactly what the backend calculator itself does.
  const annualPension = (preview.pension ?? 0) * 12;
  const annualNhf = (preview.nhf ?? 0) * 12;

  return (
    <details className="sm:col-span-2 -mt-1">
      <summary className="cursor-pointer text-sm text-brand-purple hover:underline w-fit">
        How is this PAYE figure calculated?
      </summary>

      <div className="mt-3 rounded-xl border border-brand-border bg-gray-50 p-4 space-y-3">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-0.5 text-brand-text-secondary">Annual gross</td>
              <td className="py-0.5 text-right tabular-nums">
                {formatNumber(preview.annual_gross ?? 0)}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 text-brand-text-secondary">Less pension</td>
              <td className="py-0.5 text-right tabular-nums">({formatNumber(annualPension)})</td>
            </tr>
            <tr>
              <td className="py-0.5 text-brand-text-secondary">Less NHF</td>
              <td className="py-0.5 text-right tabular-nums">({formatNumber(annualNhf)})</td>
            </tr>
            <tr>
              <td className="py-0.5 text-brand-text-secondary">Less consolidated relief</td>
              <td className="py-0.5 text-right tabular-nums">
                ({formatNumber(preview.consolidated_relief ?? 0)})
              </td>
            </tr>
            <tr className="border-t border-brand-border">
              <td className="py-1 font-semibold text-brand-text-primary">Taxable income</td>
              <td className="py-1 text-right tabular-nums font-semibold">
                {formatNumber(preview.taxable_income)}
              </td>
            </tr>
          </tbody>
        </table>

        {preview.bands && preview.bands.length > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {preview.bands.map((b) => (
                <tr key={b.sequence}>
                  <td className="py-0.5 text-brand-text-secondary">
                    {formatNumber(b.amount_taxed)} @ {(b.rate * 100).toFixed(0)}%
                  </td>
                  <td className="py-0.5 text-right tabular-nums">{formatNumber(b.tax)}</td>
                </tr>
              ))}
              <tr className="border-t border-brand-border">
                <td className="py-1 font-semibold text-brand-text-primary">Annual tax</td>
                <td className="py-1 text-right tabular-nums font-semibold">
                  {formatNumber(preview.annual_tax ?? 0)}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-brand-text-secondary">Monthly PAYE (÷ 12)</td>
                <td className="py-0.5 text-right tabular-nums">{formatNumber(preview.paye)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <p className="text-xs text-brand-text-secondary">
          Calculated under &ldquo;{preview.config_name}&rdquo;.
        </p>
      </div>
    </details>
  );
}
