import { describe, expect, it } from "vitest";
import {
  apiKeyCreationSchema,
  resourceRegistrationSchema,
  tunnelMessageSchema
} from "./index.js";

describe("validators", () => {
  it("accepts a valid HTTP resource registration", () => {
    expect(
      resourceRegistrationSchema.parse({
        name: "Local app",
        type: "http-api",
        hostId: "laptop",
        config: { url: "http://localhost:8080" }
      })
    ).toMatchObject({ name: "Local app" });
  });

  it("requires database connection details", () => {
    expect(() =>
      resourceRegistrationSchema.parse({
        name: "Database",
        type: "database",
        hostId: "laptop",
        config: { engine: "postgres" }
      })
    ).toThrow();
  });

  it("accepts scoped API key creation", () => {
    expect(apiKeyCreationSchema.parse({ name: "CI", resourceId: "res_123" })).toEqual({
      name: "CI",
      resourceId: "res_123"
    });
  });

  it("validates tunnel response messages", () => {
    expect(
      tunnelMessageSchema.parse({
        type: "proxy:response",
        payload: {
          requestId: "req_1",
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: "{}"
        }
      })
    ).toMatchObject({ type: "proxy:response" });
  });
});
