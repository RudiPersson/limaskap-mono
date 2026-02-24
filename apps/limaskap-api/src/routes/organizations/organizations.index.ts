import { createRouter } from "../../lib/create-app";
import * as handlers from "./organizations.handlers";
import * as routes from "./organizations.routes";

const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.getOneWithPrograms, handlers.getOneWithPrograms)
    .openapi(routes.getBySubdomain, handlers.getBySubdomain)
    .openapi(routes.getOrganizationProgram, handlers.getOrganizationProgram);

export default router;
