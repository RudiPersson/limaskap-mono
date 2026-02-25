const endpointMap: Record<string, string[]> = {
  "/health": ["get"],
  "/api": ["get"],
  "/api/organizations": ["get", "post"],
  "/api/organizations/{id}": ["get"],
  "/api/organizations/{id}/programs": ["get"],
  "/api/organizations/subdomain/{subdomain}": ["get"],
  "/api/organizations/{subdomain}/programs/{programId}": ["get"],
  "/api/programs": ["get", "post"],
  "/api/programs/{id}": ["get", "patch", "delete"],
  "/api/enrollments": ["get", "post"],
  "/api/enrollments/{id}": ["get"],
  "/api/enrollments/invoice/{invoiceHandle}": ["get"],
  "/api/user/enrollments": ["get"],
  "/api/user/members": ["get", "post"],
  "/api/user/members/{id}": ["patch"],
  "/api/payments/session/charge": ["post"],
  "/api/payments/{handle}/status": ["get"],
  "/api/webhooks/frisbii": ["post"],
};

const genericResponse = {
  200: {
    description: "Success",
  },
};

const paths = Object.fromEntries(
  Object.entries(endpointMap).map(([path, methods]) => {
    return [
      path,
      Object.fromEntries(
        methods.map(method => [
          method,
          {
            responses: genericResponse,
          },
        ]),
      ),
    ];
  }),
);

export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "LIMASKAP API",
    version: "1.0.0",
  },
  paths,
};
