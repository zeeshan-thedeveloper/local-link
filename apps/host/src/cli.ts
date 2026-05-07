#!/usr/bin/env node
import { Command } from "commander";
import {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  type HostResourceConfig
} from "./config.js";
import { startDaemon } from "./daemon.js";

const program = new Command();

program.name("locallink").description("LocalLink host daemon").version("0.1.0");

program
  .command("init")
  .requiredOption("--gateway <url>", "Gateway URL")
  .requiredOption("--token <token>", "Resource host token")
  .action(async (options: { gateway: string; token: string }) => {
    const response = await fetch(`${trimTrailingSlash(options.gateway)}/hosts/me`, {
      headers: { authorization: `Bearer ${options.token}` }
    });
    if (!response.ok) {
      process.stderr.write(`Failed to verify host token: ${response.status} ${response.statusText}\n`);
      process.exitCode = 1;
      return;
    }

    const host = (await response.json()) as {
      resourceId: string;
      name: string;
      type: HostResourceConfig["type"];
      gatewayUrl?: string;
    };
    const config = await loadConfigOrDefault(options.gateway);
    config.gatewayUrl = host.gatewayUrl || options.gateway;
    const existing = config.resources.find((resource) => resource.id === host.resourceId);
    config.resources = [
      ...config.resources.filter((resource) => resource.id !== host.resourceId),
      {
        id: host.resourceId,
        name: host.name,
        type: host.type,
        token: options.token,
        config: existing?.config ?? defaultResourceConfig(host.type)
      }
    ];
    await saveConfig(config);
    process.stdout.write(`Initialized resource '${host.name}' (id: ${host.resourceId})\n`);
    process.stdout.write(`Run \`locallink register --id ${host.resourceId} ...\` to set local connection details.\n`);
    process.stdout.write("Run `locallink start` to connect.\n");
  });

program.command("start").action(async () => {
  const config = await loadConfig();
  startDaemon(config);
});

program
  .command("register")
  .requiredOption("--id <id>", "Resource id from the gateway")
  .option("--name <name>", "Display name")
  .option("--type <type>", "database, ai-model, or http-api")
  .option("--url <url>", "Local HTTP or model base URL")
  .option("--connection-string <url>", "Postgres connection string")
  .action(async (options: Record<string, string>) => {
    const config = await loadConfig();
    const resource = toResource(options, config.resources.find((item) => item.id === options.id));
    config.resources = [...config.resources.filter((item) => item.id !== resource.id), resource];
    await saveConfig(config);
    process.stdout.write(`Registered ${resource.name} (${resource.id})\n`);
  });

program.command("status").action(async () => {
  const config = await loadConfig();
  process.stdout.write(
    JSON.stringify(
      {
        gatewayUrl: config.gatewayUrl,
        resources: config.resources.map(({ id, name, type }) => ({ id, name, type }))
      },
      null,
      2
    ) + "\n"
  );
});

function toResource(options: Record<string, string | undefined>, existing?: HostResourceConfig): HostResourceConfig {
  const id = requireOption(options.id, "--id");
  if (!existing) throw new Error(`Resource ${id} is not initialized. Run locallink init first.`);

  const name = options.name ?? existing.name;
  const type = options.type ?? existing.type;
  if (type === "http-api") {
    if (!options.url) throw new Error("--url is required for http-api resources");
    return {
      id,
      name,
      type: "http-api",
      token: existing.token,
      config: { url: options.url }
    };
  }
  if (type === "database") {
    if (!options.connectionString) throw new Error("--connection-string is required for database resources");
    return {
      id,
      name,
      type: "database",
      token: existing.token,
      config: { engine: "postgres", connectionString: options.connectionString }
    };
  }
  if (type === "ai-model") {
    if (!options.url) throw new Error("--url is required for ai-model resources");
    return {
      id,
      name,
      type: "ai-model",
      token: existing.token,
      config: { provider: "openai-compatible", baseUrl: options.url, model: name }
    };
  }
  throw new Error("Unsupported resource type");
}

function requireOption(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function loadConfigOrDefault(gatewayUrl: string) {
  try {
    return await loadConfig();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return createDefaultConfig(gatewayUrl);
    }
    throw error;
  }
}

function defaultResourceConfig(type: HostResourceConfig["type"]): HostResourceConfig["config"] {
  if (type === "database") return { engine: "postgres", connectionString: "postgresql://localhost:5432/app" };
  if (type === "ai-model") return { provider: "openai-compatible", baseUrl: "http://localhost:11434", model: "local" };
  return { url: "http://localhost:3000" };
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

await program.parseAsync();
