import { and, count, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "../../lib/types";
import type { CreateRoute, GetBySubdomainRoute, GetOneRoute, GetOneWithProgramsRoute, GetOrganizationProgramRoute, ListRoute } from "./organizations.routes";

import { db } from "../../db/index";
import { enrollmentTable } from "../../db/schema/enrollment";
import { organizationTable } from "../../db/schema/organization";
import { programsTable } from "../../db/schema/program";
import { oreToKroner } from "../../lib/currency.js";


/**
 * Helper function to convert program price from øre to kroner
 */
function convertProgramPrice<T extends { price: number }>(program: T): T {
    return {
        ...program,
        price: oreToKroner(program.price),
    };
}

export const list: AppRouteHandler<ListRoute> = async (c) => {
    
    const organizations = await db.query.organizationTable.findMany();

    return c.json(organizations);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
    const organization = c.req.valid("json");
    const [inserted] = await db.insert(organizationTable).values(organization).returning();
    return c.json(inserted, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
    const { id } = c.req.valid("param");

    const organization = await db.query.organizationTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, id);
        },
    });

    if (!organization) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    return c.json(organization, HttpStatusCodes.OK);
};

export const getOneWithPrograms: AppRouteHandler<GetOneWithProgramsRoute> = async (c) => {
    const { id } = c.req.valid("param");

    // Use a left join to get organization with all its programs in a single query
    const result = await db
        .select({
            organization: organizationTable,
            program: programsTable,
        })
        .from(organizationTable)
        .leftJoin(programsTable, eq(organizationTable.id, programsTable.organizationId))
        .where(eq(organizationTable.id, id));

    if (result.length === 0) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    // Transform the result into the expected structure
    const organizationWithPrograms = {
        ...result[0].organization,
        programs: result
            .filter(row => row.program !== null)
            .map(row => convertProgramPrice(row.program!)),
    };

    return c.json(organizationWithPrograms, HttpStatusCodes.OK);
};

export const getBySubdomain: AppRouteHandler<GetBySubdomainRoute> = async (c) => {
    const { subdomain } = c.req.valid("param");

    // First, get the organization by subdomain
    const organization = await db.query.organizationTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.subdomain, subdomain);
        },
    });

    if (!organization) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    // Get programs with enrollment counts using a left join and count aggregation
    const programsWithCounts = await db
        .select({
            program: programsTable,
            enrollmentCount: count(enrollmentTable.id),
        })
        .from(programsTable)
        .leftJoin(enrollmentTable, eq(programsTable.id, enrollmentTable.programId))
        .where(eq(programsTable.organizationId, organization.id))
        .groupBy(programsTable.id);

    // Transform the result to include enrollment count for each program
    const programs = programsWithCounts.map(row => ({
        ...convertProgramPrice(row.program),
        enrollmentCount: Number(row.enrollmentCount),
    }));

    // Transform the result into the expected structure
    const organizationWithPrograms = {
        ...organization,
        programs,
    };

    return c.json(organizationWithPrograms, HttpStatusCodes.OK);
};

export const getOrganizationProgram: AppRouteHandler<GetOrganizationProgramRoute> = async (c) => {
    const { subdomain, programId } = c.req.valid("param");

    // Use a join to validate that the program belongs to the organization by subdomain in a single query
    const result = await db
        .select({
            program: programsTable,
        })
        .from(programsTable)
        .innerJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
        .where(
            and(
                eq(organizationTable.subdomain, subdomain),
                eq(programsTable.id, Number.parseInt(programId, 10))
            )
        );

    if (result.length === 0) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    // Convert price and return the program
    const program = convertProgramPrice(result[0].program);
    return c.json(program, HttpStatusCodes.OK);
};
