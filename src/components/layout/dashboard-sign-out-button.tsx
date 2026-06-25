"use client";

import { Button } from "@/src/components/ui/button";
import { clearStoredOpenHandsToken } from "@/src/lib/cloud-auth-storage";

export function DashboardSignOutButton() {
  return (
    <Button
      variant="secondary"
      className="h-9 w-full rounded-md px-3 text-xs"
      onClick={() => {
        clearStoredOpenHandsToken();
        window.location.href = "/";
      }}
    >
      Sign out
    </Button>
  );
}
