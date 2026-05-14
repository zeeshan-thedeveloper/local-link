import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { proxyRequest } from "./proxy.js";

describe("proxyRequest", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("proxies HTTP resources", async () => {
    const server = createServer((request, response) => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ method: request.method, url: request.url }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    close = () => new Promise((resolve) => server.close(() => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP server address");

    const result = await proxyRequest(
      { id: "res_1", type: "http-api", config: { type: "http-api", url: `http://127.0.0.1:${address.port}` } },
      {
        requestId: "req_1",
        resourceId: "res_1",
        method: "GET",
        path: "/hello?x=1",
        headers: {},
        body: null
      }
    );

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? "{}")).toEqual({ method: "GET", url: "/hello?x=1" });
  });
});
