"use client";

import { Button } from "@/src/components/ui/button";
import { logoutViaMainApp } from "@/src/lib/main-app-auth";

export function DashboardSignOutButton() {
  return (
    <Button
      variant="secondary"
      className="h-9 w-full rounded-md px-3 text-xs"
      onClick={() => {
        void logoutViaMainApp();
      }}
    >
      Sign out
    </Button>
  );
}
