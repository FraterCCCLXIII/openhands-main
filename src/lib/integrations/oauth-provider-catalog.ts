import { listOAuthProviderCatalog as listExtensionOAuthProviderCatalog } from "@openhands/extensions/integrations";

import type { OAuthProviderCatalogOption } from "@/src/types/integrations-hub";

export const listOAuthProviderCatalog = (): OAuthProviderCatalogOption[] =>
  listExtensionOAuthProviderCatalog() as OAuthProviderCatalogOption[];
