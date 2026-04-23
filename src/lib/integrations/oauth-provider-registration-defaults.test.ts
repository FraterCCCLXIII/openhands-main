import { describe, expect, it } from "vitest";

import { getOAuthProviderRegistrationDefaults } from "@/src/lib/integrations/oauth-provider-registration-defaults";

describe("getOAuthProviderRegistrationDefaults", () => {
  it("includes HubSpot's required baseline oauth scope", () => {
    expect(getOAuthProviderRegistrationDefaults("hubspot")?.scopes).toEqual([
      "oauth",
      "crm.objects.contacts.read",
    ]);
  });
});
