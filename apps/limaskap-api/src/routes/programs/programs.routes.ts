import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";

import {
  insertProgramsSchema,
  patchProgramsSchema,
  selectProgramsSchema,
} from "../../db/schema/program";
import { notFoundSchema } from "../../lib/constants";

const tags = ["Programs"];

export const list = createRoute({
  path: "/programs",
  method: "get",
  tags,
  summary: "List programs",
  description: "Get all programs",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectProgramsSchema),
      "The list of programs",
    ),
  },
});

export const create = createRoute({
  path: "/programs",
  method: "post",
  summary: "Create program",
  description: "Create a new program",
  request: {
    body: jsonContentRequired(insertProgramsSchema, "The program to create"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectProgramsSchema,
      "The created program",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertProgramsSchema),
      "The validation error(s)",
    ),
  },
});

export const getOne = createRoute({
  path: "/programs/{id}",
  method: "get",
  summary: "Get program",
  description: "Get a specific program by ID",
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectProgramsSchema,
      "The requested program",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Program not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error",
    ),
  },
});

export const patch = createRoute({
  path: "/programs/{id}",
  method: "patch",
  summary: "Update program",
  description: "Update an existing program",
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(patchProgramsSchema, "The program updates"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectProgramsSchema,
      "The updated program",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Program not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchProgramsSchema).or(
        createErrorSchema(IdParamsSchema),
      ),
      "The validation error(s)",
    ),
  },
});

export const remove = createRoute({
  path: "/programs/{id}",
  method: "delete",
  summary: "Delete program",
  description: "Delete a program by ID",
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Program deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Program not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error",
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RemoveRoute = typeof remove;
