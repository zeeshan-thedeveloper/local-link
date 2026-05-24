export type PoolOptions = {
  gateway: string;
  resourceId: string;
  apiKey: string;
};

export type QueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount: number;
};

/**
 * Drop-in replacement for `pg.Pool` that routes queries through a LocalLink
 * tunnel instead of connecting to Postgres directly.
 *
 * The gateway receives the query via HTTP, forwards it over the socket tunnel
 * to your local machine, and your local machine runs it against the real DB.
 *
 * Usage:
 *   import { Pool } from '@locallink/client/pg';
 *   const pool = new Pool({ gateway, resourceId, apiKey });
 *   const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
 */
export class Pool {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(options: PoolOptions) {
    this.endpoint = `${options.gateway.replace(/\/$/, "")}/r/${options.resourceId}/query`;
    this.headers = {
      "content-type": "application/json",
      authorization: `Bearer ${options.apiKey}`,
    };
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ sql, params: params ?? [] }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.status.toString());
      throw new Error(`LocalLink query failed (${res.status}): ${body}`);
    }

    return res.json() as Promise<QueryResult<T>>;
  }

  // No-op — HTTP has no persistent connection to close.
  async end(): Promise<void> {}
}

/**
 * Returns a LocalLink Pool if LOCALLINK_API_KEY is set, otherwise returns null.
 * Useful for feature-flagging the tunnel without touching production code paths.
 */
export function fromEnv(): Pool | null {
  const gateway = process.env.LOCALLINK_GATEWAY;
  const resourceId = process.env.LOCALLINK_RESOURCE_ID;
  const apiKey = process.env.LOCALLINK_API_KEY;
  if (!gateway || !resourceId || !apiKey) return null;
  return new Pool({ gateway, resourceId, apiKey });
}
