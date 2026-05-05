export type IntegrationsHubDebugDetails = Record<string, unknown>;

export class IntegrationsHubError extends Error {
  public readonly statusCode: number;
  public readonly debugDetails?: IntegrationsHubDebugDetails;

  constructor(
    message: string,
    statusCode = 400,
    debugDetails?: IntegrationsHubDebugDetails,
  ) {
    super(message);
    this.name = "IntegrationsHubError";
    this.statusCode = statusCode;
    this.debugDetails = debugDetails;
  }
}
