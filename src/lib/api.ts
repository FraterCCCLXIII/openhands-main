import { NextResponse } from "next/server";

import { ContextLayerError } from "@/src/lib/core/errors";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

const shouldIncludeAdminDebug = async () => {
  try {
    const [{ auth }, { isAppAdminEmail }] = await Promise.all([
      import("@/src/lib/auth"),
      import("@/src/lib/app-admins"),
    ]);
    const session = await auth();
    return isAppAdminEmail(session?.user?.email ?? undefined);
  } catch {
    return false;
  }
};

export const fromError = async (error: unknown) => {
  const includeAdminDebug = await shouldIncludeAdminDebug();

  if (error instanceof ContextLayerError) {
    return NextResponse.json(
      {
        detail: error.message,
        ...(includeAdminDebug && error.debugDetails
          ? { debug: error.debugDetails }
          : {}),
      },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json(
    {
      detail: message,
      ...(includeAdminDebug && error instanceof Error
        ? {
            debug: {
              errorName: error.name,
            },
          }
        : {}),
    },
    { status: 500 },
  );
};
