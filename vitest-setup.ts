import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { server } from "mocks/node";
import { afterAll, afterEach, beforeAll } from "vitest";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
