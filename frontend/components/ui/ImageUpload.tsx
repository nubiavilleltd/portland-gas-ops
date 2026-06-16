"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/modules/products/types/product.types";

// ── Unified internal item ─────────────────────────────────
// Represents either an existing saved image or a new local file
type ImageItem =
  | { kind: "existing"; image: ProductImage }
  | { kind: "new";      file: File; previewUrl: string };

interface ImageUploadProps {
  // New files selected by user
  value: File[];
  onChange: (files: File[]) => void;
  // Existing saved images (edit mode)
  existingImages?: ProductImage[];
  onRemoveExisting?: (id: string) => void;
  // Config
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  existingImages = [],
  onRemoveExisting,
  maxFiles = 3,
  maxSizeMB = 5,
  label,
  hint,
  required,
  error,
  className,
}: ImageUploadProps) {
  const inputRef            = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]     = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const maxBytes     = maxSizeMB * 1024 * 1024;
  const displayError = error ?? localError;

  // ── Build unified list ────────────────────────────────────
  const items: ImageItem[] = [
    ...existingImages.map((img): ImageItem => ({ kind: "existing", image: img })),
    ...value.map((file): ImageItem => ({
      kind:       "new",
      file,
      previewUrl: URL.createObjectURL(file),
    })),
  ];

  const totalCount = items.length;
  const atLimit    = totalCount >= maxFiles;

  // ── Get display URL for any item ─────────────────────────
  function getUrl(item: ImageItem): string {
    return item.kind === "existing" ? item.image.url : item.previewUrl;
  }

  function getName(item: ImageItem): string {
    return item.kind === "existing" ? item.image.name : item.file.name;
  }

  // ── Add new files ─────────────────────────────────────────
  function addFiles(incoming: FileList | File[]) {
    setLocalError(null);
    const list = Array.from(incoming);

    const tooBig = list.find((f) => f.size > maxBytes);
    if (tooBig) {
      setLocalError(`"${tooBig.name}" exceeds the ${maxSizeMB} MB limit.`);
      return;
    }

    const merged = [...value, ...list];

    if (existingImages.length + merged.length > maxFiles) {
      setLocalError(`Maximum ${maxFiles} image${maxFiles !== 1 ? "s" : ""} allowed.`);
      return;
    }

    // Deduplicate by name+size
    const seen   = new Set<string>();
    const deduped = merged.filter((f) => {
      const key = `${f.name}-${f.size}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    onChange(deduped);
    setActiveIndex(existingImages.length + deduped.length - 1);
  }

  // ── Remove item ───────────────────────────────────────────
  function removeItem(index: number) {
    setLocalError(null);
    const item = items[index];

    if (item.kind === "existing") {
      onRemoveExisting?.(item.image.id);
    } else {
      // Find which index in value[] this new file is
      const newFileIndex = index - existingImages.length;
      onChange(value.filter((_, i) => i !== newFileIndex));
    }

    setActiveIndex(Math.max(0, index - 1));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      {/* ── Hero preview ──────────────────────────────────── */}
      {items.length > 0 && (
        <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border border-brand-border bg-gray-50">
          <img
            src={getUrl(items[activeIndex])}
            alt={getName(items[activeIndex])}
            className="w-full h-full object-cover"
          />
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeItem(activeIndex)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
          {/* Counter */}
          {items.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
              {activeIndex + 1} / {items.length}
            </div>
          )}
          {/* Existing badge */}
          {items[activeIndex]?.kind === "existing" && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
              Saved
            </div>
          )}
          {/* New badge */}
          {items[activeIndex]?.kind === "new" && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-brand-purple/80 text-white text-xs">
              New
            </div>
          )}
        </div>
      )}

      {/* ── Thumbnail strip ───────────────────────────────── */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors shrink-0",
                i === activeIndex
                  ? "border-brand-purple"
                  : "border-brand-border hover:border-brand-purple/50"
              )}
            >
              <img
                src={getUrl(item)}
                alt={getName(item)}
                className="w-full h-full object-cover"
              />
              {/* Saved/New indicator dot */}
              <div className={cn(
                "absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white",
                item.kind === "existing" ? "bg-gray-400" : "bg-brand-purple"
              )} />
            </button>
          ))}

          {/* Add more button */}
          {!atLimit && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-14 h-14 rounded-lg border-2 border-dashed border-brand-border hover:border-brand-purple hover:bg-purple-50/20 flex items-center justify-center text-gray-400 hover:text-brand-purple transition-colors shrink-0"
              aria-label="Add image"
            >
              <UploadCloud size={18} />
            </button>
          )}
        </div>
      )}

      {/* ── Drop zone (no images yet) ─────────────────────── */}
      {items.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-4 cursor-pointer transition-colors select-none",
            dragging
              ? "border-brand-purple bg-brand-purple/5"
              : displayError
              ? "border-red-400 bg-red-50/30 hover:border-red-500"
              : "border-brand-border bg-white hover:border-brand-purple hover:bg-purple-50/20"
          )}
        >
          <UploadCloud
            size={28}
            className={dragging ? "text-brand-purple" : "text-gray-400"}
          />
          <div className="text-center">
            <p className="text-sm text-brand-text-secondary">
              <span className="text-brand-purple font-medium">
                Click to attach
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              PNG, JPG, JPEG, WEBP · Max {maxSizeMB} MB per file
              {maxFiles > 1 ? ` · Up to ${maxFiles} images` : ""}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg,image/webp"
        multiple={maxFiles > 1}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* ── Error / hint ──────────────────────────────────── */}
      {displayError && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle size={12} /> {displayError}
        </p>
      )}
      {!displayError && hint && (
        <p className="text-xs text-brand-text-secondary">{hint}</p>
      )}
      {atLimit && !displayError && (
        <p className="text-xs text-brand-text-secondary">
          Maximum of {maxFiles} image{maxFiles !== 1 ? "s" : ""} reached.
        </p>
      )}
    </div>
  );
}