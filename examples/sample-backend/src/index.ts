import express from 'express';
import 'dotenv/config';
import { fromEnv } from '@locallink/client/pg';

const pool = fromEnv();

if (!pool) {
  console.error(
    'Missing LocalLink env vars. Copy .env.example to .env and fill in your credentials.'
  );
  process.exit(1);
}

const app = express();
app.use(express.json());

const gateway = process.env.LOCALLINK_GATEWAY!;
const resourceId = process.env.LOCALLINK_RESOURCE_ID!;
const apiKeyPreview = process.env.LOCALLINK_API_KEY!.slice(0, 12) + '...';
const port = Number(process.env.PORT ?? 3000);

// GET /
app.get('/', (_req, res) => {
  res.json({
    service: 'locallink-sample-backend',
    gateway,
    resourceId,
    apiKey: apiKeyPreview,
    status: 'connected',
  });
});

// GET /db/test
app.get('/db/test', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ now: string; version: string }>(
      'SELECT now()::text, version()'
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /users
app.get('/users', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users LIMIT 20');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /users/:id
app.get('/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /users
app.post('/users', async (req, res) => {
  const { name, email } = req.body ?? {};
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`
LocalLink Sample Backend
  Gateway:    ${gateway}
  Resource:   ${resourceId}
  API Key:    ${apiKeyPreview}
  Listening:  http://localhost:${port}
  `);
});
