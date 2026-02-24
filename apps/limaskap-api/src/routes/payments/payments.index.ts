import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./payments.handlers.js";
import * as routes from "./payments.routes.js";

const router = createRouter()
  .openapi(routes.createChargeSessionRoute, handlers.createChargeSession)
  .openapi(routes.getPaymentStatusRoute, handlers.getPaymentStatus);

export default router;

