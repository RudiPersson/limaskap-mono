import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";

import {
  insertOrganizationSchema,
  selectOrganizationSchema,
} from "../../db/schema/organization";
import { selectProgramsSchema, selectProgramsWithEnrollmentCountSchema } from "../../db/schema/program";
import { notFoundSchema } from "../../lib/constants";

const tags = ["Organizations"];

// Parameter schema for organization subdomain and program ID
const OrganizationProgramParamsSchema = z.object({
  subdomain: z.string().min(1).openapi({
    param: {
      name: "subdomain",
      in: "path",
    },
    example: "example-org",
  }),
  programId: z.string().min(1).openapi({
    param: {
      name: "programId",
      in: "path",
    },
    example: "1",
  }),
});

export const list = createRoute({
  path: "/organizations",
  method: "get",
  tags,
  summary: "List organizations",
  description: "Get all organizations",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectOrganizationSchema),
      "The list of organizations"
    ),
  },
});

export const getOne = createRoute({
  path: "/organizations/{id}",
  method: "get",
  tags,
  summary: "Get organization",
  description: "Get a specific organization by ID",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectOrganizationSchema,
      "The requested organization"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Organization not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error"
    ),
  },
});

export const getOneWithPrograms = createRoute({
  path: "/organizations/{id}/programs",
  method: "get",
  tags,
  summary: "Get organization with programs",
  description: "Get an organization with all its programs",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.intersection(
        selectOrganizationSchema,
        z.object({ programs: z.array(selectProgramsSchema) })
      ),
      "The requested organization with all related programs"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Organization not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error"
    ),
  },
});

export const create = createRoute({
  path: "/organizations",
  method: "post",
  summary: "Create organization",
  description: "Create a new organization",
  request: {
    body: jsonContentRequired(insertOrganizationSchema, "The organization to create"),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectOrganizationSchema,
      "The created organization",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertOrganizationSchema),
      "The validation error(s)",
    ),
  },
});

export const getBySubdomain = createRoute({
  path: "/organizations/subdomain/{subdomain}",
  method: "get",
  tags,
  summary: "Get organization by subdomain",
  description: "Get an organization by its subdomain with programs and enrollment counts",
  request: {
    params: z.object({
      subdomain: z.string().min(1).openapi({
        param: {
          name: "subdomain",
          in: "path",
        },
        example: "example-org",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.intersection(
        selectOrganizationSchema,
        z.object({
          programs: z.array(selectProgramsWithEnrollmentCountSchema)
        })
      ),
      "The requested organization by subdomain with all related programs including enrollment counts"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Organization not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(z.object({
        subdomain: z.string().min(1).openapi({
          param: {
            name: "subdomain",
            in: "path",
          },
          example: "example-org",
        }),
      })),
      "Invalid subdomain error"
    ),
  },
});

export const getOrganizationProgram = createRoute({
  path: "/organizations/{subdomain}/programs/{programId}",
  method: "get",
  tags,
  summary: "Get specific program from organization",
  description: "Get a specific program that belongs to an organization by subdomain",
  request: {
    params: OrganizationProgramParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectProgramsSchema,
      "The requested program from the organization"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Organization or program not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(OrganizationProgramParamsSchema),
      "Invalid organization or program ID error"
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type GetOneWithProgramsRoute = typeof getOneWithPrograms;
export type GetBySubdomainRoute = typeof getBySubdomain;
export type GetOrganizationProgramRoute = typeof getOrganizationProgram;
