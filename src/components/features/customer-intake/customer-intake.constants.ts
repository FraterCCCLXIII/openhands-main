import type {
  CustomerCompanySize,
  CustomerCompanyType,
} from "#/hooks/use-tracking";

export const CUSTOMER_INTAKE_DISMISSED_STORAGE_KEY =
  "openhands.customer_intake_dismissed";

export const CUSTOMER_INTAKE_COMPANY_SIZES: readonly CustomerCompanySize[] = [
  "solo",
  "2_10",
  "11_50",
  "51_200",
  "201_1000",
  "1000_plus",
];

export const CUSTOMER_INTAKE_COMPANY_TYPES: readonly CustomerCompanyType[] = [
  "startup",
  "agency",
  "enterprise",
  "education",
  "nonprofit",
  "government",
  "other",
];

export const OPENHANDS_REPO_URL = "https://github.com/OpenHands/OpenHands";
export const OPENHANDS_DESKTOP_DOWNLOAD_URL =
  "https://github.com/OpenHands/OpenHands/releases";
export const OPENHANDS_MOBILE_APP_URL = "https://openhands.dev/";
export const OPENHANDS_PRICING_URL = "https://openhands.dev/pricing";
