export class ContextLayerError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ContextLayerError";
    this.statusCode = statusCode;
  }
}
