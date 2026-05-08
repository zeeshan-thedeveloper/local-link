#!/usr/bin/env node
import { Command } from "commander";
import { input, password, select, confirm } from "@inquirer/prompts";
import {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  type HostResourceConfig
} from "./config.js";
import type { DatabaseResourceConfig, HttpResourceConfig, AiModelResourceConfig } from "@locallink/shared";
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

program.command("setup").description("Interactive wizard to initialise and register a resource").action(async () => {
  let existingConfig: Awaited<ReturnType<typeof loadConfig>> | undefined;
  try {
    existingConfig = await loadConfig();
  } catch {
    // no config yet — fine
  }

  const gatewayUrl = trimTrailingSlash(
    await input({
      message: "Gateway URL:",
      default: existingConfig?.gatewayUrl ?? "http://localhost:3003"
    })
  );

  const token = await password({
    message: "Host token (from the dashboard):"
  });

  process.stdout.write("Verifying token…\n");
  const response = await fetch(`${gatewayUrl}/hosts/me`, {
    headers: { authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    process.stderr.write(`Failed to verify token: ${response.status} ${response.statusText}\n`);
    process.exitCode = 1;
    return;
  }

  const host = (await response.json()) as {
    resourceId: string;
    name: string;
    type: HostResourceConfig["type"];
    gatewayUrl?: string;
  };
  process.stdout.write(`Found resource: ${host.name} (${host.type})\n`);

  const config = existingConfig ?? createDefaultConfig(gatewayUrl);
  config.gatewayUrl = host.gatewayUrl ?? gatewayUrl;
  const existing = config.resources.find((r) => r.id === host.resourceId);

  let resourceConfig: HostResourceConfig["config"];
  if (host.type === "database") {
    const existingCs = existing?.type === "database" ? (existing.config as DatabaseResourceConfig).connectionString : undefined;
    const connectionString = await input({
      message: "Postgres connection string:",
      default: existingCs ?? "postgresql://localhost:5432/app"
    });
    resourceConfig = { engine: "postgres", connectionString };
  } else if (host.type === "http-api") {
    const existingUrl = existing?.type === "http-api" ? (existing.config as HttpResourceConfig).url : undefined;
    const url = await input({
      message: "Local HTTP base URL:",
      default: existingUrl ?? "http://localhost:3000"
    });
    resourceConfig = { url };
  } else {
    const existingBase = existing?.type === "ai-model" ? (existing.config as AiModelResourceConfig).baseUrl : undefined;
    const baseUrl = await input({
      message: "Local model base URL:",
      default: existingBase ?? "http://localhost:11434"
    });
    resourceConfig = { provider: "openai-compatible", baseUrl, model: host.name };
  }

  config.resources = [
    ...config.resources.filter((r) => r.id !== host.resourceId),
    { id: host.resourceId, name: host.name, type: host.type, token, config: resourceConfig }
  ];
  await saveConfig(config);
  process.stdout.write(`Saved config for '${host.name}'.\n`);

  const shouldStart = await confirm({ message: "Start the tunnel now?", default: true });
  if (shouldStart) {
    startDaemon(config);
  } else {
    process.stdout.write("Run `locallink start` when ready.\n");
  }
});

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

await program.parseAsync();
