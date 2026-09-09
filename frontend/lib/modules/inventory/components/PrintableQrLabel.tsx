// lib/modules/inventory/components/PrintableQrLabel.tsx

"use client";

import React from "react";
import QrCode from "@/components/ui/QrCode";
import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";

interface PrintableQrLabelProps {
  item: InventoryItem;
  productName: string | undefined;
  qrValue: string;
}

const PrintableQrLabel = React.forwardRef<HTMLDivElement, PrintableQrLabelProps>(
  ({ item, productName, qrValue }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          background: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "2rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            background: "white",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <QrCode value={qrValue} size={200} />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "1.25rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {item.tag_number}
            </p>
            <p
              style={{
                fontSize: "1rem",
                color: "#4b5563",
                margin: "0.25rem 0 0 0",
              }}
            >
              {productName ?? "Unknown Product"}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrintableQrLabel.displayName = "PrintableQrLabel";

export default PrintableQrLabel;