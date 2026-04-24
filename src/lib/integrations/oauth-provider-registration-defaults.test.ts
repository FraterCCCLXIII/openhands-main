import { describe, expect, it } from "vitest";

import { getOAuthProviderRegistrationDefaults } from "@/src/lib/integrations/oauth-provider-registration-defaults";

describe("getOAuthProviderRegistrationDefaults", () => {
  it("returns a broad default HubSpot scope bundle including the baseline oauth scope", () => {
    expect(getOAuthProviderRegistrationDefaults("hubspot")?.scopes).toEqual([
      "oauth",
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
      "crm.objects.companies.read",
      "crm.objects.companies.write",
      "crm.objects.deals.read",
      "crm.objects.deals.write",
      "tickets",
      "crm.objects.owners.read",
      "crm.schemas.contacts.read",
      "crm.schemas.companies.read",
      "crm.schemas.deals.read",
    ]);
  });
});
