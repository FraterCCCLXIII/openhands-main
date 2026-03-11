export type ContextLayerDebugDetails = Record<string, unknown>;

export class ContextLayerError extends Error {
  public readonly statusCode: number;
  public readonly debugDetails?: ContextLayerDebugDetails;

  constructor(
    message: string,
    statusCode = 400,
    debugDetails?: ContextLayerDebugDetails,
  ) {
    super(message);
    this.name = "ContextLayerError";
    this.statusCode = statusCode;
    this.debugDetails = debugDetails;
  }
}
