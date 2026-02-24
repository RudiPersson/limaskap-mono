import { createRouter } from "../../lib/create-app";
import * as handlers from "./enrollments.handlers";
import * as routes from "./enrollments.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.getByInvoiceHandle, handlers.getByInvoiceHandle);

export default router;