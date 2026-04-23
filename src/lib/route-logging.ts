import { ContextLayerError } from "@/src/lib/core/errors";

export type RouteLogDetails = Record<string, unknown>;

export const logRouteInfo = (route: string, event: string, details: RouteLogDetails = {}) => {
  console.info("[route]", {
    route,
    event,
    ...details,
  });
};

export const summarizeRouteError = (error: unknown): RouteLogDetails => {
  if (error instanceof ContextLayerError) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    errorMessage: "Unexpected error",
  };
};
