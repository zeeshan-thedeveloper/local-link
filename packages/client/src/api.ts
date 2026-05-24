export type ClientOptions = {
  /** Full base URL of the gateway endpoint, e.g. https://my-api.locallink.zeeshanahmed.app */
  gateway: string;
  /** API key - ll_xxx token from the dashboard */
  apiKey: string;
  /** Extra headers sent on every request */
  headers?: Record<string, string>;
};

export class LocalLinkClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;

  constructor(options: ClientOptions) {
    this.base = options.gateway.replace(/\/$/, "");
    this.headers = {
      authorization: `Bearer ${options.apiKey}`,
      ...options.headers,
    };
  }

  fetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${this.base}${path}`, {
      ...init,
      headers: { ...this.headers, ...(init.headers as Record<string, string> | undefined) },
    });
  }

  get(path: string, init?: RequestInit) {
    return this.fetch(path, { ...init, method: "GET" });
  }

  post(path: string, init?: RequestInit) {
    return this.fetch(path, { ...init, method: "POST" });
  }

  put(path: string, init?: RequestInit) {
    return this.fetch(path, { ...init, method: "PUT" });
  }

  patch(path: string, init?: RequestInit) {
    return this.fetch(path, { ...init, method: "PATCH" });
  }

  delete(path: string, init?: RequestInit) {
    return this.fetch(path, { ...init, method: "DELETE" });
  }
}

export function createClient(options: ClientOptions): LocalLinkClient {
  return new LocalLinkClient(options);
}

/** Returns a client if LOCALLINK_API_KEY + LOCALLINK_GATEWAY are set, otherwise null. */
export function fromEnv(): LocalLinkClient | null {
  const gateway = process.env.LOCALLINK_GATEWAY;
  const apiKey = process.env.LOCALLINK_API_KEY;
  if (!gateway || !apiKey) return null;
  return createClient({ gateway, apiKey });
}
