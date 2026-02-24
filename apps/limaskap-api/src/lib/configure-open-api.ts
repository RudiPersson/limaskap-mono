import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

// import packageJSON from "../../package.json" with { type: "json" };

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "LIMASKAP API",
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      theme: "kepler",
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
}
