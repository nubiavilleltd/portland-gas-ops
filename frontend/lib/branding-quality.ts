import {
  getContrastRatio,
  getContrastTextColor,
  mixHex,
  normalizeHexColor,
} from "@/lib/company-branding";

export interface BrandColorSuggestion {
  label: string;
  primary: string;
  secondary: string;
  reason: string;
}

export function getBrandColorSuggestions(primaryColor: string, secondaryColor: string): BrandColorSuggestion[] {
  const primary = normalizeHexColor(primaryColor, "#7234BD");
  const secondary = normalizeHexColor(secondaryColor, "#1C043B");
  const candidates = [
    {
      label: "Higher contrast",
      primary,
      secondary: getContrastTextColor(primary),
      reason: "Creates the clearest separation for navigation and action surfaces.",
    },
    {
      label: "Lighter secondary",
      primary,
      secondary: mixHex(secondary, "#FFFFFF", 0.38),
      reason: "Softens a dark secondary color while keeping the brand hue.",
    },
    {
      label: "Darker secondary",
      primary,
      secondary: mixHex(secondary, "#000000", 0.32),
      reason: "Adds depth when the two selected colors are too similar in brightness.",
    },
  ];

  return candidates.filter((candidate, index, all) =>
    all.findIndex((item) => item.primary === candidate.primary && item.secondary === candidate.secondary) === index,
  );
}

export interface LogoInspection {
  width: number;
  height: number;
  fileSize: number;
  transparentPaddingRatio: number;
}

export function inspectLogoFile(file: File): Promise<LogoInspection> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      try {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const scale = Math.min(1, 1000 / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas inspection is unavailable");

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            const alpha = pixels[(y * canvas.width + x) * 4 + 3];
            if (alpha > 12) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        const visibleArea = maxX >= minX && maxY >= minY
          ? (maxX - minX + 1) * (maxY - minY + 1)
          : 0;
        const canvasArea = canvas.width * canvas.height;

        resolve({
          width,
          height,
          fileSize: file.size,
          transparentPaddingRatio: canvasArea ? Math.max(0, 1 - visibleArea / canvasArea) : 0,
        });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not inspect this image"));
    };
    image.src = objectUrl;
  });
}

export function getLogoWarnings(info: LogoInspection): string[] {
  const warnings: string[] = [];
  if (info.fileSize > 1.5 * 1024 * 1024) {
    warnings.push("This file is close to the 2 MB upload limit and may take longer to process.");
  }
  if (Math.min(info.width, info.height) < 160) {
    warnings.push(`This image is ${info.width} × ${info.height}px and may look blurry when enlarged.`);
  }
  if (info.width / info.height > 4 || info.height / info.width > 4) {
    warnings.push("This logo has a very wide or tall shape and may appear small in compact navigation.");
  }
  if (info.transparentPaddingRatio > 0.45) {
    warnings.push("The image contains a lot of empty space and may appear smaller than expected.");
  }
  return warnings;
}

export function getColorPairRatio(primaryColor: string, secondaryColor: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(primaryColor) || !/^#[0-9a-f]{6}$/i.test(secondaryColor)) return null;
  return getContrastRatio(primaryColor, secondaryColor);
}
