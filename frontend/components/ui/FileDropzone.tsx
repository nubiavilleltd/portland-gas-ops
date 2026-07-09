"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  FileArchive,
  FileImage,
  FileText,
  FileVideo,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FileDropzone — drag-and-drop + click-to-browse file upload zone.
 *
 * Usage:
 *   <FileDropzone
 *     value={files}
 *     onChange={setFiles}
 *     accept=".pdf,.png,.jpg,.jpeg"
 *     maxFiles={5}
 *     maxSizeMB={10}
 *     label="Supporting Documents"
 *     hint="Attach invoices, quotes, or other supporting documents"
 *   />
 */

interface Props {
  value: File[];
  onChange: (files: File[]) => void;
  /** File type filter, e.g. ".pdf,.png,.jpg" or "image/*" */
  accept?: string;
  /** Maximum number of files allowed. Default: 5 */
  maxFiles?: number;
  /** Maximum file size in MB per file. Default: 10 */
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({
  value,
  onChange,
  accept,
  maxFiles = 5,
  maxSizeMB = 10,
  label,
  hint,
  required,
  error,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  function addFiles(incoming: FileList | File[]) {
    setLocalError(null);
    const list = Array.from(incoming);

    // Size check
    const tooBig = list.find((f) => f.size > maxBytes);
    if (tooBig) {
      setLocalError(`"${tooBig.name}" exceeds the ${maxSizeMB} MB limit.`);
      return;
    }

    const merged = [...value, ...list];

    // Max files check
    if (merged.length > maxFiles) {
      setLocalError(`Maximum ${maxFiles} file${maxFiles !== 1 ? "s" : ""} allowed.`);
      return;
    }

    // Deduplicate by name+size
    const seen = new Set<string>();
    const deduped = merged.filter((f) => {
      const key = `${f.name}-${f.size}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    onChange(deduped);
  }

  function removeFile(index: number) {
    setLocalError(null);
    onChange(value.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  const displayError = error ?? localError;
  const atLimit = value.length >= maxFiles;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      {/* Drop zone */}
      {!atLimit && (
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
              <span className="text-brand-purple font-medium">Click to attach</span>
              {" "}or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {accept ? accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ") : "Any file type"}
              {" · "}Max {maxSizeMB} MB per file
              {maxFiles > 1 ? ` · Up to ${maxFiles} files` : ""}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = ""; // reset so same file can be re-added
            }}
          />
        </div>
      )}

      {/* File list */}
      {value.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((file, i) => (
            <FilePreviewItem
              key={`${file.name}-${i}`}
              file={file}
              onRemove={() => removeFile(i)}
            />
          ))}
        </ul>
      )}

      {/* Hints / errors */}
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
          Maximum of {maxFiles} file{maxFiles !== 1 ? "s" : ""} reached.
        </p>
      )}
    </div>
  );
}

function FilePreviewItem({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(file.name);
  const previewUrl = useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage],
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <li className="min-w-0 rounded-lg border border-brand-border bg-white p-2">
      <div className="flex items-start justify-between gap-2">
        {previewUrl && !previewFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-md border border-brand-border object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <FileTypeIcon file={file} />
        )}
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label={`Remove ${file.name}`}
        >
          <X size={14} />
        </button>
      </div>
      <p className="mt-2 truncate text-xs font-medium text-brand-text-primary">
        {file.name}
      </p>
      <p className="text-[11px] text-brand-text-secondary">{formatBytes(file.size)}</p>
    </li>
  );
}

function FileTypeIcon({ file }: { file: File }) {
  const iconClassName = "text-brand-purple";
  const icon = getFileType(file);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-brand-border bg-gray-50">
      {icon === "image" ? (
        <FileImage size={18} className={iconClassName} />
      ) : icon === "video" ? (
        <FileVideo size={18} className={iconClassName} />
      ) : icon === "archive" ? (
        <FileArchive size={18} className={iconClassName} />
      ) : (
        <FileText size={18} className={iconClassName} />
      )}
    </div>
  );
}

function getFileType(file: File) {
  const mimeType = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/.test(name)) {
    return "image";
  }

  if (mimeType.startsWith("video/") || /\.(mp4|mov|avi|webm|mkv)$/.test(name)) {
    return "video";
  }

  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) {
    return "archive";
  }

  return "document";
}
