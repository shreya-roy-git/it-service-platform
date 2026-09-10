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

const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function requireEnvironmentVariable(name: "DATABASE_URL" | "JWT_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured.`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  corsOrigins,
  databaseUrl: requireEnvironmentVariable("DATABASE_URL"),
  jwtSecret: requireEnvironmentVariable("JWT_SECRET"),
} as const;

