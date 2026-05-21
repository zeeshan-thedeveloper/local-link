const HOP_BY_HOP_REQUEST = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "accept-encoding",
]);

const HOP_BY_HOP_RESPONSE = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export function buildUpstreamRequestHeaders(
  upstreamOrigin: string,
  incoming: Record<string, string>,
) {
  const upstream = new URL(upstreamOrigin.endsWith("/") ? upstreamOrigin : `${upstreamOrigin}/`);
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(incoming)) {
    if (HOP_BY_HOP_REQUEST.has(key.toLowerCase())) continue;
    headers[key] = value;
  }

  headers.host = upstream.host;
  if (incoming.host) headers["x-forwarded-host"] = incoming.host;
  if (incoming["x-forwarded-proto"]) headers["x-forwarded-proto"] = incoming["x-forwarded-proto"];
  else if (incoming["x-forwarded-host"]) headers["x-forwarded-proto"] = "https";

  return headers;
}

export function sanitizeUpstreamResponseHeaders(headers: Record<string, string>) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (HOP_BY_HOP_RESPONSE.has(key.toLowerCase())) continue;
    next[key] = value;
  }
  return next;
}
