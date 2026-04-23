import { describe, expect, it } from "vitest";

import { ContextLayerError } from "@/src/lib/core/errors";
import { summarizeRouteError } from "@/src/lib/route-logging";

describe("summarizeRouteError", () => {
  it("preserves explicit ContextLayerError messages", () => {
    expect(summarizeRouteError(new ContextLayerError("Permission denied.", 403))).toEqual({
      errorName: "ContextLayerError",
      errorMessage: "Permission denied.",
      statusCode: 403,
    });
  });

  it("sanitizes unexpected Error instances", () => {
    expect(summarizeRouteError(new Error("database password missing"))).toEqual({
      errorName: "Error",
      errorMessage: "Unexpected internal error",
      statusCode: 500,
      sanitized: true,
    });
  });

  it("sanitizes non-Error throwables", () => {
    expect(summarizeRouteError("bad throwable")).toEqual({
      errorMessage: "Unexpected internal error",
      statusCode: 500,
      sanitized: true,
    });
  });
});
