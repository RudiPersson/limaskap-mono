import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./frisbii.handlers.js";
import * as routes from "./frisbii.routes.js";

const router = createRouter()
  .openapi(routes.webhookRoute, handlers.webhook);

export default router;

