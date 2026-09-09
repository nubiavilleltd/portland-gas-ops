"use client";

import QrCode from "@/components/ui/QrCode";

interface PrintableQrLabelProps {
  /** The QR value (URL or text) to encode */
  qrValue: string;
  /** Primary identifier (tag number, asset tag, etc.) */
  primaryIdentifier: string;
  /** Secondary identifier (product name, asset name, etc.) */
  secondaryIdentifier: string;
  /** Optional: override the default label text */
  secondaryIdentifierFallback?: string;
}

export default function PrintableQrLabel({
  qrValue,
  primaryIdentifier,
  secondaryIdentifier,
  secondaryIdentifierFallback = "Unknown",
}: PrintableQrLabelProps) {
  return (
    <div className="hidden print:block print:flex print:items-center print:justify-center print:bg-white print:z-50">
      <div className="print:flex print:flex-col print:items-center print:justify-center print:gap-6 print:p-8">
        <QrCode value={qrValue} size={200} />
        <div className="print:text-center">
          <p className="print:font-mono print:text-xl print:font-semibold">
            {primaryIdentifier || "No Identifier"}
          </p>
          <p className="print:text-base print:text-gray-600">
            {secondaryIdentifier || secondaryIdentifierFallback}
          </p>
        </div>
      </div>
    </div>
  );
}