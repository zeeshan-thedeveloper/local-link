import { describe, expect, it } from "vitest";
import { buildUpstreamRequestHeaders } from "./proxy-headers.js";

describe("buildUpstreamRequestHeaders", () => {
  it("replaces the browser host with the local upstream host", () => {
    const headers = buildUpstreamRequestHeaders("http://localhost:25543", {
      host: "locallink-api.zeeshanahmed.app",
      "accept-encoding": "gzip, deflate, br",
      accept: "text/html",
    });

    expect(headers.host).toBe("localhost:25543");
    expect(headers["x-forwarded-host"]).toBe("locallink-api.zeeshanahmed.app");
    expect(headers["accept-encoding"]).toBeUndefined();
    expect(headers.accept).toBe("text/html");
  });
});
