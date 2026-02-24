import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import enrollments from "@/routes/enrollments/enrollments.index";
import health from "@/routes/health/health.index";
import index from "@/routes/index.route";
import organizations from "@/routes/organizations/organizations.index";
import payments from "@/routes/payments/payments.index";
import programs from "@/routes/programs/programs.index";
import user from "@/routes/user/user.index";
import webhooks from "@/routes/webhooks/frisbii.index";



const app = createApp();
configureOpenAPI(app);

const routes = [index, organizations, programs, enrollments, payments, user, webhooks] as const;

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Mount health endpoint at root level (not under /api)
app.route("/", health);

routes.forEach((route) => {
  app.route("/api", route);
  // app.basePath("/api").route("/v1", route);
});

export default app;
