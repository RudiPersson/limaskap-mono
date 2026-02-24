import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import env from "../env.js";

export function pinoLogger() {
   const isDev = env.NODE_ENV === "development";
  
  
  const transport = isDev
    ? undefined
    : pino.transport({
        target: "@logtail/pino",
        options: {
          sourceToken: env.LOGTAIL_SOURCE_TOKEN!,
          options: { endpoint: env.LOGTAIL_INGEST_ENDPOINT! },
        },
      });

  return logger({
    pino: pino(
      { level: env.LOG_LEVEL || "info" },
      isDev ? pretty() : transport,
    ),
  });
}
