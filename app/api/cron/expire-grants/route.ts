import { NextResponse } from "next/server";

import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        { detail: "CRON_SECRET must be configured for the expire-grants cron route." },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const service = getContextLayerService();
    const purged = await service.purgeExpiredGrants();
    return NextResponse.json({ purged });
  } catch (error) {
    return fromError(error);
  }
}
