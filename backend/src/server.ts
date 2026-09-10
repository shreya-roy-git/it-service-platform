import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();

    const server = app.listen(env.port, () => {
      console.info(`API listening on port ${env.port} in ${env.nodeEnv} mode.`);
    });

    function shutdown(signal: string): void {
      console.info(`${signal} received. Shutting down API server.`);
      server.close((error) => {
        if (error) {
          console.error("Unable to close API server cleanly.", error);
          process.exitCode = 1;
        }

        void prisma.$disconnect();
      });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to connect to PostgreSQL.", error);
    process.exitCode = 1;
  }
}

void startServer();
