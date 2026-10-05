import "dotenv/config";

import cors from "cors";
import express from "express";
import authRouter from './auth/sqliteRoutes.js'
import { uploadRouter, receiptStaticPath } from './auth/payments.js'

const {
  PORT = "5000",
  JWT_SECRET = "dev-secret-change-in-production",
  CLIENT_ORIGIN = "http://localhost:8080",
} = process.env;

if (!JWT_SECRET) {
  console.warn("⚠️  Using default JWT_SECRET. Set JWT_SECRET in production!");
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

// Serve uploaded receipts statically
app.use('/uploads/receipts', express.static(receiptStaticPath))

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true, message: "Server is running with SQLite database" });
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
