import { get, patch, post, postForm } from "@/lib/api";
import type { CompanyBranding, LogoBackground, WorkspaceStatus } from "@/lib/company-branding";

export interface WorkspaceBrandingResponse {
  id: string;
  membership_id: string;
  name: string;
  logo_url: string | null;
  logo_background: LogoBackground;
  primary_color: string;
  secondary_color: string;
  status: Exclude<WorkspaceStatus, "unknown">;
  is_configured: boolean;
  can_complete_onboarding: boolean;
  onboarding_completed_at: string | null;
}

interface WorkspaceBrandingUpdate {
  name: string;
  logoBackground: LogoBackground;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

interface WorkspaceLogoUploadResponse {
  logo_url: string;
}

export function toCompanyBranding(workspace: WorkspaceBrandingResponse): CompanyBranding {
  return {
    name: workspace.name,
    logoDataUrl: workspace.logo_url,
    logoBackground: workspace.logo_background,
    primaryColor: workspace.primary_color,
    secondaryColor: workspace.secondary_color,
  };
}

export function fetchCurrentWorkspace(): Promise<WorkspaceBrandingResponse> {
  return get<WorkspaceBrandingResponse>("/api/workspaces/current");
}

export function claimWorkspaceSetup(code: string): Promise<WorkspaceBrandingResponse> {
  return post<WorkspaceBrandingResponse>("/api/workspaces/current/claim-setup", { code });
}

export async function uploadWorkspaceLogo(file: File): Promise<WorkspaceLogoUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return postForm<WorkspaceLogoUploadResponse>("/api/workspaces/current/logo", formData);
}

export function updateWorkspaceBranding({
  name,
  logoBackground,
  primaryColor,
  secondaryColor,
  logoUrl,
}: WorkspaceBrandingUpdate): Promise<WorkspaceBrandingResponse> {
  return patch<WorkspaceBrandingResponse>("/api/workspaces/current/branding", {
    name,
    logo_background: logoBackground,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    logo_url: logoUrl,
  });
}

export async function dataUrlToLogoFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1] || "png";
  return new File([blob], `workspace-logo.${extension}`, { type: blob.type });
}
