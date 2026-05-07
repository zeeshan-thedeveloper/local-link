import type { ApiKey, RequestLog, Resource } from "./types";

export const RESOURCES: Resource[] = [];

export const KEYS: ApiKey[] = [];

export const LOGS: RequestLog[] = [];

export const statusClass = (s: number) => s >= 500 ? "sc-5xx" : s >= 400 ? "sc-4xx" : s >= 300 ? "sc-3xx" : "sc-2xx";
