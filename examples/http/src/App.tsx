import { useState } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/todos/1";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  async function fetchSample() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      setData(await response.json());
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>LocalLink HTTP Example</h1>
      <p className="hint">
        Dev server listens on port <code>25543</code>. Register this app as an HTTP resource and
        proxy requests through the LocalLink tunnel.
      </p>

      <button type="button" onClick={fetchSample} disabled={loading}>
        {loading ? "Fetching…" : "Fetch sample API"}
      </button>

      {error ? <pre className="panel error">{error}</pre> : null}

      {data ? <pre className="panel">{JSON.stringify(data, null, 2)}</pre> : null}
    </main>
  );
}
