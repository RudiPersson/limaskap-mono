import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const tags = ["Health"];

const healthStatusSchema = z.object({
  status: z.literal("ok"),
});

export const health = createRoute({
  path: "/health",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      healthStatusSchema,
      "Health check status",
    ),
  },
});

export type HealthRoute = typeof health;

