import "dotenv/config";

import cors from "cors";
import express from "express";
import authRouter from './auth/tursoRoutes.js'
import { uploadRouter } from './auth/payments-turso.js'

const {
  PORT = "5000",
  JWT_SECRET = "dev-secret-change-in-production",
  CLIENT_ORIGIN = "http://localhost:8080",
  TURSO_URL,
  TURSO_AUTH_TOKEN,
} = process.env;

if (!JWT_SECRET) {
  console.warn("⚠️  Using default JWT_SECRET. Set JWT_SECRET in production!");
}

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error("❌ Missing TURSO_URL or TURSO_AUTH_TOKEN environment variables");
  console.error("Please set these in your .env file or environment");
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

// Mount auth routes implemented in server/src/auth
app.use('/api/auth', authRouter)

// Mount payment routes
app.use('/api/payments', uploadRouter)

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true, message: "Server is running with Turso database" });
});

app.use((error, _request, response, _next) => {
  console.error(error);

  if (error?.message === "Origin is not allowed for this API.") {
    response.status(403).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Something went wrong on the auth server." });
});

app.listen(Number(PORT), () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});

app.use((error, _request, response, _next) => {
  console.error(error);

  if (error?.message === "Origin is not allowed for this API.") {
    response.status(403).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Something went wrong on the auth server." });
});

app.listen(Number(PORT), () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
