"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/src/components/ui/button";

export function DashboardSignOutButton() {
  return (
    <Button
      variant="secondary"
      className="h-9 w-full rounded-md px-3 text-xs"
      onClick={() => signOut({ redirectTo: "/" })}
    >
      Sign out
    </Button>
  );
}
