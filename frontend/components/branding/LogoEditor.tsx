"use client";

import { useState } from "react";
import { Crop, Minus, Plus, X } from "lucide-react";

interface LogoEditorProps {
  src: string;
  onApply: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

function createCroppedLogoFile(src: string, zoom: number, positionX: number, positionY: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const outputSize = 512;
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas editing is unavailable"));
        return;
      }

      const scale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight) * zoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const left = -(width - outputSize) * (positionX / 100);
      const top = -(height - outputSize) * (positionY / 100);
      context.clearRect(0, 0, outputSize, outputSize);
      context.drawImage(image, left, top, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create the cropped logo"));
          return;
        }
        resolve(new File([blob], "workspace-logo-cropped.png", { type: "image/png" }));
      }, "image/png");
    };
    image.onerror = () => reject(new Error("Could not load this logo for editing"));
    image.src = src;
  });
}

export default function LogoEditor({ src, onApply, onClose }: LogoEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyCrop() {
    setIsApplying(true);
    setError(null);
    try {
      const file = await createCroppedLogoFile(src, zoom, positionX, positionY);
      const previewUrl = URL.createObjectURL(file);
      onApply(file, previewUrl);
    } catch {
      setError("We could not edit this image. Try uploading it again as a PNG, JPG, or WEBP.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="logo-editor-title">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="logo-editor-title" className="text-base font-semibold text-brand-text-primary">Adjust your logo</h2>
            <p className="mt-1 text-xs leading-5 text-brand-text-secondary">Crop empty space or enlarge the mark so it reads well in compact navigation.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-brand-text-secondary hover:bg-gray-100" aria-label="Close logo editor">
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto mt-5 flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-brand-border">
          <img
            src={src}
            alt="Logo crop preview"
            className="h-full w-full object-cover"
            style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }}
          />
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-brand-text-primary">
            Zoom
            <div className="mt-2 flex items-center gap-3">
              <Minus size={14} className="text-brand-text-secondary" />
              <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-brand-purple" aria-label="Logo zoom" />
              <Plus size={14} className="text-brand-text-secondary" />
            </div>
          </label>
          <label className="block text-xs font-medium text-brand-text-primary">
            Horizontal position
            <input type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} className="mt-2 w-full accent-brand-purple" aria-label="Horizontal logo position" />
          </label>
          <label className="block text-xs font-medium text-brand-text-primary">
            Vertical position
            <input type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} className="mt-2 w-full accent-brand-purple" aria-label="Vertical logo position" />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-3 border-t border-brand-border pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-brand-text-secondary hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={applyCrop} disabled={isApplying} className="inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-brand-purple-dark disabled:opacity-60">
            <Crop size={15} /> {isApplying ? "Applying…" : "Use adjusted logo"}
          </button>
        </div>
      </div>
    </div>
  );
}
