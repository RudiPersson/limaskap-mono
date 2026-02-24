import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/index";
import { user } from "@/db/schema/auth-schema";
import { enrollmentTable } from "@/db/schema/enrollment";
import { memberRecordTable } from "@/db/schema/member-record";
import { organizationTable } from "@/db/schema/organization";
import { programsTable } from "@/db/schema/program";
import { createHostedCheckout } from "@/lib/frisbii/frisbii";

import type { AppRouteHandler } from "../../lib/types";
import type {
  CreateRoute,
  GetByInvoiceHandleRoute,
  GetOneRoute,
  ListRoute
} from "./enrollments.routes";


export const list: AppRouteHandler<ListRoute> = async (c) => {
  const enrollments = await db.query.enrollmentTable.findMany();
  return c.json(enrollments);
};


// to do return a checkout url
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const logger = c.var.logger;
  const enrollment = c.req.valid("json");



  // Check if enrollment already exists for this program and member
  const existingEnrollment = await db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.and(
        operators.eq(fields.programId, enrollment.programId),
        operators.eq(fields.memberId, enrollment.memberId),
      );

    },
  });

  logger.info({ existingEnrollment }, "Existing enrollment found");

  if (existingEnrollment ) {

    logger.info({ existingEnrollment }, "Creating charge session");

    return c.json(
      {
        message: "Enrollment already exists for this program , her er leinjkan",
      },
      HttpStatusCodes.CONFLICT,
    );


    // logger.info({ existingEnrollment }, "Enrollment already exists for this program and member");
    // return c.json(existingEnrollment, HttpStatusCodes.OK);
    // return c.json(
    //   {
    //     message: "Enrollment already exists for this program and member",
    //   },
    //   HttpStatusCodes.CONFLICT,
    // );
  }


  const programWithOrganization = await db
    .select()
    .from(programsTable)
    .leftJoin(
      organizationTable,
      eq(programsTable.organizationId, organizationTable.id)
    )
    .where(eq(programsTable.id, enrollment.programId))
    .limit(1);

  const programData = programWithOrganization[0];

  if (!programData || !programData.organization) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  if (!programData.organization.paymentApiKey) {
    return c.json(
      {
        message: "Payment API key not found",
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const memberRecord = await db.select()
    .from(memberRecordTable)
    .innerJoin(user, eq(memberRecordTable.userId, user.id))
    .where(eq(memberRecordTable.id, enrollment.memberId))
    .limit(1);

  const memberRecordData = memberRecord[0];

  if (!memberRecordData) {
    return c.json(
      {
        message: "Member record not found",
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const paymentHandle = `program-${enrollment.programId}-${uuidv4()}`;
  // logger.info({ paymentHandle }, "Payment handle created");
  // Build tenant URLs
  const baseUrl = `https://${programData.organization.subdomain}.limaskap.fo`;
  const successUrl = `${baseUrl}/payment/success?handle=${paymentHandle}`;
  const cancelUrl = `${baseUrl}/payment/cancel?handle=${paymentHandle}`;

  const checkoutUrl = await createHostedCheckout({
    amount: programData.program.price,
    currency: "DKK",
    successUrl,
    cancelUrl,
    handle: paymentHandle,
    apiKey: programData.organization.paymentApiKey,
    ordertext: `${programData.program.name} - ${memberRecordData.member_record.firstName} ${memberRecordData.member_record.lastName}`,
    customer: {
      handle: memberRecordData.user.email,
      email: memberRecordData.user.email,
      first_name: memberRecordData.user.name,
    },
  });
  logger.info({ checkoutUrl }, "Checkout URL created");


  // const [inserted] = await db.insert(enrollmentTable).values(enrollment).returning();
  await db.insert(enrollmentTable).values({
    ...enrollment,
    invoiceHandle: paymentHandle,
  }).returning();



  return c.json(checkoutUrl, HttpStatusCodes.CREATED);
  // return c.json(inserted, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const enrollment = await db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!enrollment) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(enrollment, HttpStatusCodes.OK);
};

export const getByInvoiceHandle: AppRouteHandler<GetByInvoiceHandleRoute> = async (c) => {
  const { invoiceHandle } = c.req.valid("param");

  const enrollment = await db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.invoiceHandle, invoiceHandle);
    },
  });

  if (!enrollment) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(enrollment, HttpStatusCodes.OK);
};
