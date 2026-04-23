import { describe, expect, it } from "vitest";

import { getOAuthProviderRegistrationDefaults } from "@/src/lib/integrations/oauth-provider-registration-defaults";

describe("getOAuthProviderRegistrationDefaults", () => {
  it("returns a broad default HubSpot scope bundle for useful CRM tools", () => {
    expect(getOAuthProviderRegistrationDefaults("hubspot")?.scopes).toEqual([
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
      "crm.objects.companies.read",
      "crm.objects.companies.write",
      "crm.objects.deals.read",
      "crm.objects.deals.write",
      "crm.objects.tickets.read",
      "crm.objects.tickets.write",
      "crm.objects.owners.read",
      "crm.schemas.contacts.read",
      "crm.schemas.companies.read",
      "crm.schemas.deals.read",
      "crm.schemas.tickets.read",
    ]);
  });
});
