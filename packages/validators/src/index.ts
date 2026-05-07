import { resourceTypes } from "@locallink/shared";
import { z } from "zod";

export const resourceTypeSchema = z.enum(resourceTypes);

export const httpResourceConfigSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string()).optional()
});

export const databaseResourceConfigSchema = z
  .object({
    engine: z.enum(["postgres", "sqlite"]),
    connectionString: z.string().min(1).optional(),
    filePath: z.string().min(1).optional()
  })
  .refine((value) => value.connectionString || value.filePath, {
    message: "Provide connectionString or filePath"
  });

export const aiModelResourceConfigSchema = z.object({
  provider: z.enum(["ollama", "openai-compatible"]),
  baseUrl: z.string().url(),
  model: z.string().min(1)
});

export const resourceRegistrationSchema = z.discriminatedUnion("type", [
  z.object({
    name: z.string().min(1).max(120),
    type: z.literal("http-api"),
    hostId: z.string().min(1),
    config: httpResourceConfigSchema
  }),
  z.object({
    name: z.string().min(1).max(120),
    type: z.literal("database"),
    hostId: z.string().min(1),
    config: databaseResourceConfigSchema
  }),
  z.object({
    name: z.string().min(1).max(120),
    type: z.literal("ai-model"),
    hostId: z.string().min(1),
    config: aiModelResourceConfigSchema
  })
]);

export const resourceUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  active: z.boolean().optional(),
  config: z
    .union([httpResourceConfigSchema, databaseResourceConfigSchema, aiModelResourceConfigSchema])
    .optional()
});

export const apiKeyCreationSchema = z.object({
  name: z.string().min(1).max(120),
  resourceId: z.string().min(1).nullable().optional()
});

export const tunnelRequestPayloadSchema = z.object({
  requestId: z.string().min(1),
  resourceId: z.string().min(1),
  method: z.string().min(1),
  path: z.string().startsWith("/"),
  headers: z.record(z.string()),
  body: z.string().nullable()
});

export const tunnelResponsePayloadSchema = z.object({
  requestId: z.string().min(1),
  statusCode: z.number().int().min(100).max(599),
  headers: z.record(z.string()),
  body: z.string().nullable()
});

export const tunnelMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("proxy:request"),
    payload: tunnelRequestPayloadSchema
  }),
  z.object({
    type: z.literal("proxy:response"),
    payload: tunnelResponsePayloadSchema
  }),
  z.object({
    type: z.literal("host:heartbeat"),
    payload: z.object({
      hostId: z.string().min(1),
      timestamp: z.string().datetime()
    })
  })
]);

export type ResourceRegistrationInput = z.infer<typeof resourceRegistrationSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
export type ApiKeyCreationInput = z.infer<typeof apiKeyCreationSchema>;

