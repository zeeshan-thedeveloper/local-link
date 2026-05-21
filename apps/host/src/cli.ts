#!/usr/bin/env node
import { confirm, input, password } from "@inquirer/prompts";
import { Command } from "commander";
import { createDefaultConfig, loadConfig, saveConfig, type HostResourceConfig } from "./config.js";
import { startDaemon, type DaemonEvent } from "./daemon.js";

const program = new Command();

program.name("locallink").description("LocalLink host daemon").version("0.1.0");

program
  .command("init")
  .requiredOption("--gateway <url>", "Gateway URL")
  .requiredOption("--token <token>", "Resource host token")
  .action(async (options: { gateway: string; token: string }) => {
    const host = await verifyHostToken(options.gateway, options.token);
    if (!host) return;

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
        config: existing?.config ?? defaultResourceConfig(host.type),
      } as HostResourceConfig,
    ];
    await saveConfig(config);
    process.stdout.write(`Initialized resource '${host.name}' (id: ${host.resourceId})\n`);
    process.stdout.write(
      `Run \`locallink register --id ${host.resourceId} ...\` to set local connection details.\n`,
    );
    process.stdout.write("Run `locallink start` to connect.\n");
  });

program
  .command("setup")
  .description("Interactive wizard to initialise and register a resource")
  .option("--gateway <url>", "Gateway URL")
  .option("--token <token>", "Resource host token")
  .action(async (options: { gateway?: string; token?: string }) => {
    const existingConfig = await loadExistingConfig();
    const gatewayUrl = trimTrailingSlash(
      options.gateway ??
        (await input({
          message: "Gateway URL:",
          default: existingConfig?.gatewayUrl ?? "http://localhost:3003",
        })),
    );
    const token =
      options.token ??
      (await password({
        message: "Host token (from the dashboard):",
      }));

    process.stdout.write("Verifying token...\n");
    const host = await verifyHostToken(gatewayUrl, token);
    if (!host) return;
    process.stdout.write(`Found resource: ${host.name} (${host.type})\n`);

    const config = existingConfig ?? createDefaultConfig(gatewayUrl);
    config.gatewayUrl = host.gatewayUrl ?? gatewayUrl;
    const existing = config.resources.find((resource) => resource.id === host.resourceId);
    const resourceConfig = await promptForResourceConfig(host, existing);

    config.resources = [
      ...config.resources.filter((resource) => resource.id !== host.resourceId),
      {
        id: host.resourceId,
        name: host.name,
        type: host.type,
        token,
        config: resourceConfig,
      } as HostResourceConfig,
    ];
    await saveConfig(config);
    process.stdout.write(`Saved config for '${host.name}'.\n`);

    const shouldStart = await confirm({ message: "Start the tunnel now?", default: true });
    if (shouldStart) {
      runDaemonDashboard(config);
    } else {
      process.stdout.write("Run `locallink start` when ready.\n");
    }
  });

program.command("start").action(async () => {
  const config = await loadConfig();
  runDaemonDashboard(config);
});

program
  .command("register")
  .requiredOption("--id <id>", "Resource id from the gateway")
  .option("--name <name>", "Display name")
  .option("--type <type>", "database or http-api")
  .option("--url <url>", "Local HTTP base URL")
  .option("--connection-string <url>", "Postgres connection string")
  .action(async (options: Record<string, string>) => {
    const config = await loadConfig();
    const resource = toResource(
      options,
      config.resources.find((item) => item.id === options.id),
    );
    config.resources = [...config.resources.filter((item) => item.id !== resource.id), resource];
    await saveConfig(config);
    process.stdout.write(`Registered ${resource.name} (${resource.id})\n`);
  });

program
  .command("remove")
  .description("Remove a registered resource from the local config")
  .argument("<name>", "Resource name (case-insensitive)")
  .action(async (name: string) => {
    const config = await loadConfig();
    const lower = name.toLowerCase();
    const resource = config.resources.find((r) => r.name.toLowerCase() === lower);
    if (!resource) {
      const names = config.resources.map((r) => r.name).join(", ") || "none";
      process.stderr.write(`No resource named "${name}". Registered: ${names}\n`);
      process.exitCode = 1;
      return;
    }
    config.resources = config.resources.filter((r) => r.id !== resource.id);
    await saveConfig(config);
    process.stdout.write(`Removed ${resource.name}\n`);
  });

program
  .command("reset")
  .description("Clear all resources from the local config")
  .action(async () => {
    const config = await loadConfig();
    const count = config.resources.length;
    config.resources = [];
    await saveConfig(config);
    process.stdout.write(`Cleared ${count} resource(s) from config.\n`);
  });

program.command("status").action(async () => {
  const config = await loadConfig();
  process.stdout.write(
    JSON.stringify(
      {
        gatewayUrl: config.gatewayUrl,
        resources: config.resources.map(({ id, name, type }) => ({ id, name, type })),
      },
      null,
      2,
    ) + "\n",
  );
});

type HostLookup = {
  resourceId: string;
  name: string;
  type: HostResourceConfig["type"];
  config?: HostResourceConfig["config"];
  gatewayUrl?: string;
};

async function verifyHostToken(gatewayUrl: string, token: string): Promise<HostLookup | null> {
  const response = await fetch(`${trimTrailingSlash(gatewayUrl)}/hosts/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    process.stderr.write(
      `Failed to verify host token: ${response.status} ${response.statusText}\n`,
    );
    process.exitCode = 1;
    return null;
  }
  return response.json() as Promise<HostLookup>;
}

async function promptForResourceConfig(
  host: HostLookup,
  existing?: HostResourceConfig,
): Promise<HostResourceConfig["config"]> {
  if (host.type === "database") {
    const serverConnectionString =
      host.config?.type === "database" ? host.config.connectionString : undefined;
    const existingConnectionString =
      existing?.type === "database" ? existing.config.connectionString : undefined;
    const defaultConnectionString = existingConnectionString ?? serverConnectionString;
    if (defaultConnectionString) {
      process.stdout.write(`Using connection string from gateway config.\n`);
      return { type: "database", engine: "postgres", connectionString: defaultConnectionString };
    }
    const connectionString = await input({
      message: "Postgres connection string:",
      default: "postgresql://locallink:locallink@localhost:5433/locallink",
    });
    return { type: "database", engine: "postgres", connectionString };
  }
  if (host.type === "http-api") {
    const serverUrl = host.config?.type === "http-api" ? host.config.url : undefined;
    const existingUrl = existing?.type === "http-api" ? existing.config.url : undefined;
    const defaultUrl = existingUrl ?? serverUrl;
    if (defaultUrl) {
      process.stdout.write(`Using URL from gateway config.\n`);
      return { type: "http-api", url: defaultUrl };
    }
    const url = await input({
      message: "Local HTTP base URL:",
      default: "http://localhost:3000",
    });
    return { type: "http-api", url };
  }

  const serverBaseUrl = host.config?.type === "ai-model" ? host.config.baseUrl : undefined;
  const existingBaseUrl = existing?.type === "ai-model" ? existing.config.baseUrl : undefined;
  const defaultBaseUrl = existingBaseUrl ?? serverBaseUrl;
  if (defaultBaseUrl) {
    process.stdout.write(`Using base URL from gateway config.\n`);
    return {
      type: "ai-model",
      provider: "openai-compatible",
      baseUrl: defaultBaseUrl,
      model: host.name,
    };
  }
  const baseUrl = await input({
    message: "Local HTTP base URL:",
    default: "http://localhost:3000",
  });
  return { type: "ai-model", provider: "openai-compatible", baseUrl, model: host.name };
}

function toResource(
  options: Record<string, string | undefined>,
  existing?: HostResourceConfig,
): HostResourceConfig {
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
      config: { type: "http-api", url: options.url },
    };
  }
  if (type === "database") {
    if (!options.connectionString)
      throw new Error("--connection-string is required for database resources");
    return {
      id,
      name,
      type: "database",
      token: existing.token,
      config: { type: "database", engine: "postgres", connectionString: options.connectionString },
    };
  }
  throw new Error("Unsupported resource type. Use database or http-api.");
}

function requireOption(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function loadConfigOrDefault(gatewayUrl: string) {
  return (await loadExistingConfig()) ?? createDefaultConfig(gatewayUrl);
}

async function loadExistingConfig() {
  try {
    return await loadConfig();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function defaultResourceConfig(type: HostResourceConfig["type"]): HostResourceConfig["config"] {
  if (type === "database") {
    return {
      type: "database",
      engine: "postgres",
      connectionString: "postgresql://locallink:locallink@localhost:5433/locallink",
    };
  }
  if (type === "ai-model")
    return {
      type: "ai-model",
      provider: "openai-compatible",
      baseUrl: "http://localhost:3000",
      model: "local",
    };
  return { type: "http-api", url: "http://localhost:3000" };
}

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

type TunnelStatus = "connecting" | "connected" | "disconnected" | "error";

function runDaemonDashboard(config: Awaited<ReturnType<typeof loadConfig>>) {
  const tunnelStatus = new Map<string, TunnelStatus>(
    config.resources.map((resource) => [resource.name, "connecting"]),
  );
  const requestLines: string[] = [];

  const render = () => {
    const w = process.stdout.columns || 72;
    const line = "─".repeat(w);
    process.stdout.write("\x1bc");
    process.stdout.write(
      `${C.bold}${C.cyan}  LocalLink${C.reset}  ${C.dim}v0.3.0${C.reset}  ${C.gray}→ ${config.gatewayUrl}${C.reset}\n`,
    );
    process.stdout.write(`${C.dim}  ${line}${C.reset}\n`);
    process.stdout.write(`${C.bold}  Tunnels${C.reset}\n`);
    for (const resource of config.resources) {
      const status = tunnelStatus.get(resource.name) ?? "connecting";
      if (status === "connected") {
        process.stdout.write(
          `  ${C.green}●${C.reset}  ${C.bold}${resource.name}${C.reset}  ${C.green}connected${C.reset}\n`,
        );
      } else if (status === "disconnected") {
        process.stdout.write(
          `  ${C.red}●${C.reset}  ${C.bold}${resource.name}${C.reset}  ${C.red}disconnected${C.reset}\n`,
        );
      } else if (status === "error") {
        process.stdout.write(
          `  ${C.red}●${C.reset}  ${C.bold}${resource.name}${C.reset}  ${C.red}error${C.reset}\n`,
        );
      } else {
        process.stdout.write(
          `  ${C.dim}◌${C.reset}  ${resource.name}  ${C.dim}connecting…${C.reset}\n`,
        );
      }
    }
    process.stdout.write(`${C.dim}  ${line}${C.reset}\n`);
    process.stdout.write(`${C.bold}  Requests${C.reset}\n\n`);
    for (const entry of requestLines) process.stdout.write(entry);
  };

  render();
  startDaemon(config, (event) => {
    if (event.type === "connected") tunnelStatus.set(event.resource.name, "connected");
    else if (event.type === "disconnected") tunnelStatus.set(event.resource.name, "disconnected");
    else if (event.type === "connect_error") tunnelStatus.set(event.resource.name, "error");

    const line = formatDaemonEventLine(event);
    requestLines.push(line);

    if (
      event.type === "connected" ||
      event.type === "disconnected" ||
      event.type === "connect_error"
    ) {
      render();
      return;
    }

    process.stdout.write(line);
  });
}

function formatDaemonEventLine(event: DaemonEvent) {
  const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
  if (event.type === "connected") {
    return `  ${C.green}●${C.reset}  ${C.bold}${event.resource.name}${C.reset}  ${C.green}connected${C.reset}\n`;
  }
  if (event.type === "disconnected") {
    return `  ${C.red}●${C.reset}  ${C.bold}${event.resource.name}${C.reset}  ${C.red}disconnected${C.reset}\n`;
  }
  if (event.type === "connect_error") {
    return `  ${C.red}●${C.reset}  ${C.bold}${event.resource.name}${C.reset}  ${C.red}error: ${event.message}${C.reset}\n`;
  }

  const statusColor = event.statusCode < 300 ? C.green : event.statusCode < 500 ? C.yellow : C.red;
  const dur =
    event.durationMs < 1000 ? `${event.durationMs}ms` : `${(event.durationMs / 1000).toFixed(1)}s`;
  return `  ${C.gray}${ts}${C.reset}  ${C.dim}${event.resource.name}${C.reset}  ${C.bold}${event.method.padEnd(6)}${C.reset}  ${event.path}  ${statusColor}${event.statusCode}${C.reset}  ${C.dim}${dur}${C.reset}\n`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

await program.parseAsync();
