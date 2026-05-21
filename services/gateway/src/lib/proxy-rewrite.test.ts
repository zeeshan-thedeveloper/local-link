import { describe, expect, it } from "vitest";
import {
  rewriteProxiedHttpResponse,
  rewriteRootPathsForGatewayPrefix,
  shouldRewriteProxiedBody,
} from "./proxy-rewrite.js";

describe("proxy-rewrite", () => {
  it("rewrites root-absolute paths in HTML", () => {
    const html = '<script type="module" src="/src/main.tsx"></script>';
    expect(rewriteRootPathsForGatewayPrefix(html, "/r/res_1")).toBe(
      '<script type="module" src="/r/res_1/src/main.tsx"></script>',
    );
  });

  it("rewrites Vite client imports in JavaScript", () => {
    const js = 'import { x } from "/@vite/client";';
    expect(rewriteRootPathsForGatewayPrefix(js, "/r/res_1")).toBe(
      'import { x } from "/r/res_1/@vite/client";',
    );
  });

  it("does not rewrite protocol-relative or external URLs", () => {
    const body = '<a href="//cdn.example.com/x">x</a><img src="https://x.com/a.png">';
    expect(rewriteRootPathsForGatewayPrefix(body, "/r/res_1")).toBe(body);
  });

  it("rewrites location headers and HTML bodies together", () => {
    const { body, headers } = rewriteProxiedHttpResponse(
      '<script src="/@vite/client"></script>',
      { "content-type": "text/html", location: "/dashboard" },
      "res_1",
    );
    expect(body).toContain('src="/r/res_1/@vite/client"');
    expect(headers.location).toBe("/r/res_1/dashboard");
    expect(headers["content-length"]).toBeUndefined();
  });

  it("skips non-rewritable content types", () => {
    const input = '{"url":"/api"}';
    const { body } = rewriteProxiedHttpResponse(
      input,
      { "content-type": "application/json" },
      "res_1",
    );
    expect(body).toBe(input);
  });

  it("detects rewritable content types", () => {
    expect(shouldRewriteProxiedBody("text/html; charset=utf-8")).toBe(true);
    expect(shouldRewriteProxiedBody("application/javascript")).toBe(true);
    expect(shouldRewriteProxiedBody("application/json")).toBe(false);
  });
});
