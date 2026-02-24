import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import env from "@/env";

import type { AppBindings } from "./types";

import { auth } from "../lib/auth";
import { pinoLogger } from "../middlewares/pino-logger";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {

  const app = createRouter();
  app
    .use(serveEmojiFavicon("⚽️"))
    .use(pinoLogger())
    .use(
      "/api/*",
      cors({
        // `c` is a `Context` object
        origin: (origin) => {

          if (origin.endsWith(".limaskap.fo")) {
            return origin;
          }
          if (env.NODE_ENV === "development" && origin.includes("localhost")) {

            return origin;
          }
          return null;
        },
        credentials: true,
      })

    )
    .use("*", async (c, next) => {

      const session = await auth.api.getSession({ headers: c.req.raw.headers });

      if (!session) {
        c.set("user", null);
        c.set("session", null);
        return next();
      }

      c.set("user", session.user);
      c.set("session", session.session);
      return next();
    }).use("*", (c, next) => {


      return next();
    });

  app.notFound(notFound);
  app.onError(onError);

  return app;
}
