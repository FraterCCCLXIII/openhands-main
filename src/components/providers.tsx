"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

export const Providers = ({
  children,
  authDisabled = false,
}: {
  children: React.ReactNode;
  authDisabled?: boolean;
}) => {
  const [queryClient] = useState(() => new QueryClient());
  const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  if (authDisabled) {
    return content;
  }

  return <SessionProvider>{content}</SessionProvider>;
};
