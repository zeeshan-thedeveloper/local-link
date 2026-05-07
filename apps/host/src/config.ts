import type { ResourceConfig, ResourceType } from "@locallink/shared";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type HostResourceConfig = {
  id: string;
  name: string;
  type: ResourceType;
  token: string;
  config: ResourceConfig;
};

export type HostConfig = {
  gatewayUrl: string;
  resources: HostResourceConfig[];
};

export const defaultConfigPath = join(homedir(), ".locallink", "config.json");

export async function loadConfig(path = defaultConfigPath): Promise<HostConfig> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as HostConfig;
}

export async function saveConfig(config: HostConfig, path = defaultConfigPath) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function createDefaultConfig(gatewayUrl: string): HostConfig {
  return { gatewayUrl, resources: [] };
}
