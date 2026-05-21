const REWRITABLE_CONTENT_TYPES =
  /^text\/html(?:;|$)|^text\/css(?:;|$)|^application\/javascript(?:;|$)|^text\/javascript(?:;|$)|^application\/typescript(?:;|$)|^text\/tsx(?:;|$)|^text\/jsx(?:;|$)/i;

/** Prefix root-absolute paths so assets load under /r/:resourceId/… */
export function rewriteRootPathsForGatewayPrefix(body: string, prefix: string): string {
  const normalized = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  if (!normalized.startsWith("/")) {
    throw new Error(`Gateway path prefix must start with /: ${prefix}`);
  }
  // Do not treat whitespace before "/" as a URL (avoids breaking HTML " />").
  return body.replace(/(^|["'"(=])\/(?!\/)/g, `$1${normalized}/`);
}

export function shouldRewriteProxiedBody(contentType: string | undefined) {
  if (!contentType) return false;
  return REWRITABLE_CONTENT_TYPES.test(contentType.split(";")[0]?.trim() ?? "");
}

function hasEncodedBody(headers: Record<string, string>) {
  const encoding = headers["content-encoding"] ?? headers["Content-Encoding"];
  return Boolean(encoding && encoding !== "identity");
}

export function rewriteProxiedHttpResponse(
  body: string | null,
  headers: Record<string, string>,
  resourceId: string,
): { body: string | null; headers: Record<string, string> } {
  if (!body) return { body, headers };

  const contentType = headers["content-type"] ?? headers["Content-Type"];
  if (!shouldRewriteProxiedBody(contentType) || hasEncodedBody(headers)) {
    return { body, headers: rewriteLocationHeaders(headers, resourceId) };
  }

  const prefix = `/r/${resourceId}`;
  let rewritten = rewriteRootPathsForGatewayPrefix(body, prefix);
  if (contentType?.toLowerCase().includes("text/html")) {
    rewritten = injectHtmlBaseHref(rewritten, `${prefix}/`);
  }
  const nextHeaders = { ...rewriteLocationHeaders(headers, resourceId) };
  delete nextHeaders["content-length"];
  delete nextHeaders["Content-Length"];
  delete nextHeaders.etag;
  delete nextHeaders.ETag;
  delete nextHeaders["last-modified"];
  delete nextHeaders["Last-Modified"];
  nextHeaders["cache-control"] = "no-cache";
  return { body: rewritten, headers: nextHeaders };
}

function injectHtmlBaseHref(html: string, baseHref: string) {
  if (/<base\s/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
  }
  return html;
}

function rewriteLocationHeaders(headers: Record<string, string>, resourceId: string) {
  const prefix = `/r/${resourceId}`;
  const next = { ...headers };
  for (const key of Object.keys(next)) {
    if (key.toLowerCase() !== "location") continue;
    const value = next[key];
    if (!value) continue;
    if (value.startsWith("/") && !value.startsWith("//")) {
      next[key] = `${prefix}${value}`;
    }
  }
  return next;
}
