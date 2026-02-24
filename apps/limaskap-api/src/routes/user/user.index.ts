import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./user.handlers.js";
import * as routes from "./user.routes.js";

const router = createRouter()
  .openapi(routes.listUserEnrollments, handlers.listUserEnrollments)
  .openapi(routes.listUserMembers, handlers.listUserMembers)
  .openapi(routes.createUserMember, handlers.createUserMember)
  .openapi(routes.updateUserMember, handlers.updateUserMember);

export default router;
