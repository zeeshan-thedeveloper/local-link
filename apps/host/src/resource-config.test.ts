import { describe, expect, it } from "vitest";
import { normalizeGatewayResourceConfig } from "./resource-config.js";

describe("normalizeGatewayResourceConfig", () => {
  it("reads HTTP url from dashboard config without a type field", () => {
    expect(normalizeGatewayResourceConfig("http-api", { url: "http://localhost:25543/" })).toEqual({
      type: "http-api",
      url: "http://localhost:25543",
    });
  });

  it("reads postgres connection string from dashboard config", () => {
    expect(
      normalizeGatewayResourceConfig("database", {
        engine: "postgres",
        connectionString: "postgresql://localhost:5433/app",
      }),
    ).toEqual({
      type: "database",
      engine: "postgres",
      connectionString: "postgresql://localhost:5433/app",
    });
  });

  it("returns null when required fields are missing", () => {
    expect(normalizeGatewayResourceConfig("http-api", {})).toBeNull();
    expect(normalizeGatewayResourceConfig("http-api", { type: "http-api" })).toBeNull();
  });

  it("normalizes web app and api resources", () => {
    expect(normalizeGatewayResourceConfig("web-app", { url: "http://localhost:5173/" })).toEqual({
      type: "web-app",
      url: "http://localhost:5173",
    });
    expect(
      normalizeGatewayResourceConfig("api", {
        url: "http://localhost:8080/",
        publicAccess: true,
        headers: { "x-local": " yes " },
      }),
    ).toEqual({
      type: "api",
      url: "http://localhost:8080",
      publicAccess: true,
      headers: { "x-local": "yes" },
    });
  });
});
