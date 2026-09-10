import dotenv from "dotenv";

dotenv.config();

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return 4000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

const port = parsePort(process.env.PORT);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:3000", `http://localhost:${port}`];

function requireEnvironmentVariable(name: "DATABASE_URL" | "JWT_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured.`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
  corsOrigins,
  databaseUrl: requireEnvironmentVariable("DATABASE_URL"),
  jwtSecret: requireEnvironmentVariable("JWT_SECRET"),
} as const;

