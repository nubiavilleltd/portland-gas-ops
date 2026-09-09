// components/ui/QrCode.tsx

import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface QrCodeProps {
  /** The value to encode in the QR code (e.g., a URL) */
  value: string;
  /** Size in pixels (width and height are equal) */
  size?: number;
  /** Background color of the QR code */
  bgColor?: string;
  /** Foreground color of the QR code */
  fgColor?: string;
  /** Additional className for positioning/margins */
  className?: string;
}

export default function QrCode({
  value,
  size = 200,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  className,
}: QrCodeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        className
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      <QRCode
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}