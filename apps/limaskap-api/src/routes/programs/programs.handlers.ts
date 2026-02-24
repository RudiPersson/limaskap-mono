import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "../../lib/types";
import type {
  CreateRoute,
  GetOneRoute,
  ListRoute,
  PatchRoute,
  RemoveRoute,
} from "./programs.routes";

import { db } from "../../db/index";
import { programsTable } from "../../db/schema/program";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "../../lib/constants";
import { kronerToOre, oreToKroner } from "../../lib/currency.js";

/**
 * Helper function to convert program price from øre to kroner
 */
function convertProgramPrice<T extends { price: number }>(program: T): T {
  return {
    ...program,
    price: oreToKroner(program.price),
  };
}

/**
 * Helper function to convert input price from kroner to øre for database storage
 */
function convertInputPrice<T extends { price: number }>(input: T): T {
  return {
    ...input,
    price: kronerToOre(input.price),
  };
}

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const programs = await db.query.programsTable.findMany();
  const programsWithKronerPrices = programs.map(convertProgramPrice);
  return c.json(programsWithKronerPrices);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const program = c.req.valid("json");
  const programWithOrePrice = convertInputPrice(program);
  const [inserted] = await db.insert(programsTable).values(programWithOrePrice).returning();
  return c.json(convertProgramPrice(inserted), HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const program = await db.query.programsTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!program) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(convertProgramPrice(program), HttpStatusCodes.OK);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  // Convert price from kroner to øre if price is being updated
  const updatesWithOrePrice = updates.price !== undefined ? convertInputPrice(updates) : updates;

  const [program] = await db
    .update(programsTable)
    .set(updatesWithOrePrice)
    .where(eq(programsTable.id, id))
    .returning();

  if (!program) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(convertProgramPrice(program), HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const result = await db.delete(programsTable).where(eq(programsTable.id, id));

  if (result.rowCount === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
