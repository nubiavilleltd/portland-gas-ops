"use client";

import QrCode from "@/components/ui/QrCode";
import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";

interface PrintableQrLabelProps {
  item: InventoryItem;
  productName: string | undefined;
  qrValue: string;
}

export default function PrintableQrLabel({
  item,
  productName,
  qrValue,
}: PrintableQrLabelProps) {
  return (
    <div className="hidden print:block print:fixed print:inset-0 print:flex print:items-center print:justify-center print:bg-white print:z-50">
      <div className="print:flex print:flex-col print:items-center print:justify-center print:gap-6 print:p-8">
        <QrCode value={qrValue} size={200} />
        <div className="print:text-center">
          <p className="print:font-mono print:text-xl print:font-semibold">
            {item.tag_number}
          </p>
          <p className="print:text-base print:text-gray-600">
            {productName ?? "Unknown Product"}
          </p>
        </div>
      </div>
    </div>
  );
}