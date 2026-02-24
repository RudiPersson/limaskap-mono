import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "../../lib/types.js";
import type { HealthRoute } from "./health.routes.js";

export const health: AppRouteHandler<HealthRoute> = async (c) => {
  return c.json({
    status: "ok",
  }, HttpStatusCodes.OK);
};

