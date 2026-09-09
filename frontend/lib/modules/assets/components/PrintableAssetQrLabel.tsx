"use client";

import QrCode from "@/components/ui/QrCode";
import type { Asset } from "@/types";

interface PrintableAssetQrLabelProps {
  asset: Asset;
  qrValue: string;
}

export default function PrintableAssetQrLabel({
  asset,
  qrValue,
}: PrintableAssetQrLabelProps) {
  return (
    <div className="hidden print:block print:flex print:items-center print:justify-center print:bg-white print:z-50">
      <div className="print:flex print:flex-col print:items-center print:justify-center print:gap-6 print:p-8">
        <QrCode value={qrValue} size={200} />
        <div className="print:text-center">
          <p className="print:font-mono print:text-xl print:font-semibold">
            {asset.asset_tag || "No Tag"}
          </p>
          <p className="print:text-base print:text-gray-600">
            {asset.name}
          </p>
        </div>
      </div>
    </div>
  );
}