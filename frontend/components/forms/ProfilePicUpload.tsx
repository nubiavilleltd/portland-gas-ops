"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilePicUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;

  /** width/height of avatar */
  size?: number;

  /** circle | square | rounded */
  shape?: "circle" | "square" | "rounded";

  /** optional label */
  label?: string;

  /** allow custom class */
  className?: string;

  /** fallback initials */
  fallback?: string;

  disabled?: boolean;
}

export default function ProfilePicUpload({
  value,
  onChange,
  size = 96,
  shape = "circle",
  label = "Profile Picture",
  className,
  fallback = "U",
  disabled,
}: ProfilePicUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    value ? URL.createObjectURL(value) : null
  );

  function handleFile(file: File | null) {
    onChange(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "rounded"
      ? "rounded-xl"
      : "rounded-md";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <p className="text-sm font-medium text-brand-text-primary">
          {label}
        </p>
      )}

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          style={{ width: size, height: size }}
          className={cn(
            "relative flex items-center justify-center border border-brand-border bg-gray-50 overflow-hidden",
            shapeClass
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-400">
              {fallback}
            </span>
          )}

          {!disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 text-white opacity-0 hover:opacity-100 transition"
            >
              <Camera size={18} />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm text-brand-purple font-medium"
            disabled={disabled}
          >
            Upload Image
          </button>

          {preview && (
            <button
              type="button"
              onClick={() => handleFile(null)}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <X size={12} /> Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFile(e.target.files?.[0] ?? null)
          }
        />
      </div>
    </div>
  );
}