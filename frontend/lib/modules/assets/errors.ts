export const ASSET_ERRORS: Record<string, string> = {
  ASSET_NOT_FOUND: "Asset not found.",
  ASSET_CATEGORY_NOT_FOUND: "Category not found.",
  ASSET_TYPE_NOT_FOUND: "Asset type not found.",
  ASSET_CATEGORY_EXISTS: "A category with this name already exists.",
  ASSET_TYPE_EXISTS: "This asset type already exists in the selected category.",
  ASSET_INSUFFICIENT_QUANTITY: "Insufficient quantity available for this asset.",
  ASSET_TRANSFER_FAILED: "Failed to transfer asset. Please try again.",
};

export function getAssetError(code: string): string {
  return ASSET_ERRORS[code] ?? "An unexpected error occurred.";
}
