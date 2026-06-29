"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/src/components/ui/button";

export function DashboardSignOutButton() {
  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => signOut({ redirectTo: "/" })}
    >
      Sign out
    </Button>
  );
}
