import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { v4 as uuidv4 } from "uuid";

import type { AppRouteHandler } from "../../lib/types.js";
import type {
  CreateChargeSessionRoute,
  GetPaymentStatusRoute,
} from "./payments.routes.js";

import { db } from "../../db/index.js";
import { enrollmentTable } from "../../db/schema/enrollment.js";
import { paymentTable } from "../../db/schema/payment.js";
import { createFrisbiiClient, FrisbiiApiError } from "../../lib/frisbii/client.js";

/**
 * Handler for POST /api/payments/session/charge
 * Creates a Frisbii checkout session for an enrollment
 */
export const createChargeSession: AppRouteHandler<CreateChargeSessionRoute> = async (c) => {
  const logger = c.var.logger;
  const user = c.var.user;

  if (!user) {
    return c.json(
      { message: "Unauthorized" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const body = c.req.valid("json");
  const { enrollmentId, currency, acceptPath, cancelPath } = body;

  logger.info({ enrollmentId, userId: user.id }, "Creating charge session");

  // Load enrollment with related data using a single join query
  const enrollmentData = await db.query.enrollmentTable.findFirst({
    where: eq(enrollmentTable.id, enrollmentId),
    with: {
      program: {
        with: {
          organization: true,
        },
      },
      member: true,
    },
  });

  if (!enrollmentData) {
    logger.warn({ enrollmentId }, "Enrollment not found");
    return c.json(
      { message: "Enrollment not found" },
      HttpStatusCodes.NOT_FOUND
    );
  }



  const { program, member } = enrollmentData;
  const organization = program.organization;

  // Validate organization has payment credentials
  if (!organization.paymentApiKey) {
    logger.error({ organizationId: organization.id }, "Organization missing payment API key");
    return c.json(
      { message: "Payment not configured for this organization" },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  // Generate unique payment handle
  const paymentHandle = `member-${enrollmentId}-${uuidv4()}`;

  // Build tenant URLs
  const baseUrl = `https://${organization.subdomain}.limaskap.fo`;
  const acceptUrl = `${baseUrl}${acceptPath}?handle=${paymentHandle}`;
  const cancelUrl = `${baseUrl}${cancelPath}?handle=${paymentHandle}`;

  // Amount is already in øre (minor units)
  const amount = program.price;

  try {
    // Create Frisbii client
    const frisbiiClient = createFrisbiiClient(organization.paymentApiKey);

    // Create customer handle
    const customerHandle = `${organization.slug}-member-${member.id}`;

    logger.info(
      {

        paymentHandle,
        amount,
        currency: currency || "DKK",
        customerHandle,
        organizationSlug: organization.slug
      },
      "Creating Frisbii charge session"
    );

    // Create charge session with Frisbii
    const sessionResponse = await frisbiiClient.createChargeSession({
      order: {
        handle: paymentHandle,
        amount,
        currency: currency || "DKK",
        customer: {
          handle: customerHandle,
          email: user.email,
          first_name: member.firstName,
          last_name: member.lastName,
          // address: member.addressLine1,
          // city: member.city,
          // postal_code: member.postalCode,
          // country: member.country,
        },
        ordertext: `${program.name} - ${member.firstName} ${member.lastName}`,
      },
      settle: true, // Direct settle at session level
      accept_url: acceptUrl,
      cancel_url: cancelUrl,
      locale: "da_DK",
    });

    logger.info(
      { sessionId: sessionResponse.id, paymentHandle },
      "Frisbii session created"
    );

    // Store payment record
    await db.insert(paymentTable).values({
      handle: paymentHandle,
      organizationId: organization.id,
      enrollmentId: enrollmentData.id,
      amount,
      currency: currency || "DKK",
      status: "PENDING",
      sessionId: sessionResponse.id,
      directSettle: true,
      acceptUrl,
      cancelUrl,
    });

    // Update enrollment payment status to PENDING
    await db
      .update(enrollmentTable)
      .set({ paymentStatus: "PENDING" })
      .where(eq(enrollmentTable.id, enrollmentId));

    return c.json(
      {
        sessionId: sessionResponse.id,
        checkoutUrl: sessionResponse.url,
        paymentHandle,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    if (error instanceof FrisbiiApiError) {
      logger.error(
        { error: error.message, statusCode: error.statusCode, response: error.response },
        "Frisbii API error"
      );
      return c.json(
        { message: `Payment provider error: ${error.message}` },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    logger.error({ error }, "Unexpected error creating charge session");
    throw error;
  }
};

/**
 * Handler for GET /api/payments/:handle/status
 * Gets the status of a payment
 */
export const getPaymentStatus: AppRouteHandler<GetPaymentStatusRoute> = async (c) => {
  const logger = c.var.logger;
  const { handle } = c.req.valid("param");

  logger.info({ handle }, "Getting payment status");

  const payment = await db.query.paymentTable.findFirst({
    where: eq(paymentTable.handle, handle),
    with: {
      enrollment: true,
    },
  });

  if (!payment) {
    logger.warn({ handle }, "Payment not found");
    return c.json(
      { message: "Payment not found" },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(
    {
      handle: payment.handle,
      status: payment.status,
      enrollmentPaymentStatus: payment.enrollment.paymentStatus as "NONE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED",
      amount: payment.amount,
      currency: payment.currency,
      frisbiiRefs: {
        sessionId: payment.sessionId,
        chargeId: payment.chargeId,
        invoiceHandle: payment.invoiceHandle,
        transactionId: payment.transactionId,
      },
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    },
    HttpStatusCodes.OK
  );
};

