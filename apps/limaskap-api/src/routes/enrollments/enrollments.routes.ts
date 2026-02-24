import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";

import { CheckoutResponseSchema } from "@/lib/frisbii/frisbii";

import {
  createEnrollmentSchema,
  selectEnrollmentSchema,
} from "../../db/schema/enrollment";
import { notFoundSchema } from "../../lib/constants";

const tags = ["Enrollments"];

export const list = createRoute({
  path: "/enrollments",
  method: "get",
  tags,
  summary: "List enrollments",
  description: "Get all program enrollments",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectEnrollmentSchema),
      "The list of enrollments"
    ),
  },
});

export const getOne = createRoute({
  path: "/enrollments/{id}",
  method: "get",
  tags,
  summary: "Get enrollment",
  description: "Get a specific enrollment by ID",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectEnrollmentSchema,
      "The requested enrollment"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Enrollment not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error"
    ),
  },
});

const InvoiceHandleParamsSchema = z.object({
  invoiceHandle: z.string(),
});

export const getByInvoiceHandle = createRoute({
  path: "/enrollments/invoice/{invoiceHandle}",
  method: "get",
  tags,
  summary: "Get enrollment by invoice handle",
  description: "Get a specific enrollment by its invoice handle",
  request: {
    params: InvoiceHandleParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectEnrollmentSchema,
      "The requested enrollment"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Enrollment not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(InvoiceHandleParamsSchema),
      "Invalid invoice handle error"
    ),
  },
});

export const create = createRoute({
  path: "/enrollments",
  method: "post",
  summary: "Create enrollment",
  description: "Enroll a member in a program",
  request: {
    body: jsonContentRequired(createEnrollmentSchema, "The enrollment to create"),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      // selectEnrollmentSchema,
      CheckoutResponseSchema,
      "The created enrollment",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Program not found",
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Enrollment already exists for this program and member",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createEnrollmentSchema),
      "The validation error(s)",
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type GetByInvoiceHandleRoute = typeof getByInvoiceHandle;