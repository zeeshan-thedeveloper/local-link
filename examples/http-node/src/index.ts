import express from "express";
import "dotenv/config";

type User = {
  id: string;
  name: string;
  email: string;
};

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 37191);

const users: User[] = [
  {
    id: "usr_ada",
    name: "Ada Lovelace",
    email: "ada@example.com",
  },
  {
    id: "usr_grace",
    name: "Grace Hopper",
    email: "grace@example.com",
  },
];

app.get("/", (_req, res) => {
  res.json({
    service: "locallink-http-node",
    status: "ready",
    routes: ["/health", "/api/users", "/api/echo"],
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "locallink-http-node",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/users", (_req, res) => {
  res.json(users);
});

app.get("/api/users/:id", (req, res) => {
  const user = users.find((item) => item.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

app.post("/api/users", (req, res) => {
  const { name, email } = req.body as Partial<User>;

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const user = {
    id: `usr_${Date.now()}`,
    name,
    email,
  };

  users.unshift(user);
  res.status(201).json(user);
});

app.delete("/api/users/:id", (req, res) => {
  const index = users.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  const [deleted] = users.splice(index, 1);
  res.json(deleted);
});

app.all("/api/echo", (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      host: req.headers.host,
      authorization: req.headers.authorization,
      "content-type": req.headers["content-type"],
    },
  });
});

app.listen(port, () => {
  console.log(`
LocalLink HTTP Node Example
  Local URL:  http://localhost:${port}
  Health:     http://localhost:${port}/health
  Users:      http://localhost:${port}/api/users
  `);
});
