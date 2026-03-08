import { NextResponse } from "next/server";

import { ContextLayerError } from "@/src/lib/core/errors";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export const fromError = (error: unknown) => {
  if (error instanceof ContextLayerError) {
    return NextResponse.json({ detail: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ detail: message }, { status: 500 });
};
