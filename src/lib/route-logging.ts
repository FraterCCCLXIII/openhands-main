import { ContextLayerError } from "@/src/lib/core/errors";

export type RouteLogDetails = Record<string, unknown>;

const UNEXPECTED_ROUTE_ERROR_MESSAGE = "Unexpected internal error";

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
      errorMessage: UNEXPECTED_ROUTE_ERROR_MESSAGE,
      statusCode: 500,
      sanitized: true,
    };
  }

  return {
    errorMessage: UNEXPECTED_ROUTE_ERROR_MESSAGE,
    statusCode: 500,
    sanitized: true,
  };
};
