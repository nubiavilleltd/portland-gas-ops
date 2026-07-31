export type CustomerType = "company" | "individual";

export type CustomerCategory =
  | "retail"
  | "industrial"
  | "distributor"
  | "government";

export type CustomerStatus = "active" | "inactive" | "blacklisted";

export type CustomerOnboardingStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "returned"
  | "rejected";
