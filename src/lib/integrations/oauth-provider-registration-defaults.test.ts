import { describe, expect, it } from "vitest";

import { getOAuthProviderRegistrationDefaults } from "@/src/lib/integrations/oauth-provider-registration-defaults";

describe("getOAuthProviderRegistrationDefaults", () => {
  it("returns split HubSpot required and optional scopes with narrow tool defaults", () => {
    const defaults = getOAuthProviderRegistrationDefaults("hubspot");

    expect(defaults?.clientAuthentication).toBe("body");
    expect(defaults?.scopes).toEqual(["oauth", "crm.objects.contacts.read"]);
    expect(defaults?.optionalScopes).toEqual([
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
    expect(defaults?.toolScopes).toEqual(["crm.objects.contacts.read"]);
  });
});
