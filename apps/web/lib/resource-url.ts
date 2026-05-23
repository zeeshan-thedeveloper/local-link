import type { Resource } from "@/lib/types";

export const gatewayBaseDomain =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_DOMAIN ?? "locallink.zeeshanahmed.app";

export function resourceEndpoint(
  resource: Pick<Resource, "id" | "slug" | "type">,
  gatewayUrl: string,
) {
  if ((resource.type === "web-app" || resource.type === "api") && resource.slug) {
    return `${gatewayProtocol(gatewayBaseDomain)}://${resource.slug}.${stripProtocol(gatewayBaseDomain)}`;
  }
  return `${gatewayUrl}/r/${resource.id}`;
}

function gatewayProtocol(domain: string) {
  if (domain.startsWith("http://")) return "http";
  if (domain.includes("lvh.me") || domain.includes("localhost") || domain.includes("127.0.0.1")) {
    return "http";
  }
  return "https";
}

function stripProtocol(domain: string) {
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
