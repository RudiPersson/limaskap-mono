import { randomUUID } from "node:crypto";

import { createChargeSessionInputSchema } from "@/features/payments/server/contracts";
import { PaymentProviderDomainError } from "@/features/payments/server/errors";
import * as repository from "@/features/payments/server/repository";
import {
  BadRequestDomainError,
  NotFoundDomainError,
  UnauthorizedDomainError,
  ValidationDomainError,
  toZodErrorPayload,
} from "@/lib/server/errors";
import { FrisbiiApiError, createFrisbiiClient } from "@/lib/server/frisbii/client";
import { assertViewer, ViewerContext } from "@/lib/server/session";

export async function createChargeSession(viewer: ViewerContext | null, input: unknown) {
  assertViewer(viewer);

  const parsed = createChargeSessionInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  const { enrollmentId, currency, acceptPath, cancelPath } = parsed.data;

  const row = await repository.getEnrollmentPaymentContext(enrollmentId);

  if (!row) {
    throw new NotFoundDomainError("Enrollment not found");
  }

  if (row.member.userId !== viewer.userId) {
    throw new UnauthorizedDomainError();
  }

  if (!row.organization.paymentApiKey) {
    throw new BadRequestDomainError("Payment not configured for this organization");
  }

  const paymentHandle = `member-${enrollmentId}-${randomUUID()}`;
  const baseUrl = `https://${row.organization.subdomain}.limaskap.fo`;
  const acceptUrl = `${baseUrl}${acceptPath}?handle=${paymentHandle}`;
  const cancelUrl = `${baseUrl}${cancelPath}?handle=${paymentHandle}`;

  const amount = row.program.price;

  try {
    const frisbiiClient = createFrisbiiClient(row.organization.paymentApiKey);
    const customerHandle = `${row.organization.slug}-member-${row.member.id}`;

    const sessionResponse = await frisbiiClient.createChargeSession({
      order: {
        handle: paymentHandle,
        amount,
        currency,
        customer: {
          handle: customerHandle,
          email: viewer.email,
          first_name: row.member.firstName,
          last_name: row.member.lastName,
        },
        ordertext: `${row.program.name} - ${row.member.firstName} ${row.member.lastName}`,
      },
      settle: true,
      accept_url: acceptUrl,
      cancel_url: cancelUrl,
      locale: "da_DK",
    });

    await repository.createPayment({
      handle: paymentHandle,
      organizationId: row.organization.id,
      enrollmentId: row.enrollment.id,
      amount,
      currency,
      status: "PENDING",
      sessionId: sessionResponse.id,
      directSettle: true,
      acceptUrl,
      cancelUrl,
    });

    await repository.setEnrollmentPaymentPending(enrollmentId);

    return {
      sessionId: sessionResponse.id,
      checkoutUrl: sessionResponse.url,
      paymentHandle,
    };
  } catch (error) {
    if (error instanceof FrisbiiApiError) {
      throw new PaymentProviderDomainError(`Payment provider error: ${error.message}`);
    }

    throw error;
  }
}

export async function getPaymentStatusByHandle(handle: string) {
  const row = await repository.getPaymentStatusByHandle(handle);

  if (!row) {
    return null;
  }

  return {
    handle: row.payment.handle,
    status: row.payment.status,
    enrollmentPaymentStatus: row.enrollment.paymentStatus,
    amount: row.payment.amount,
    currency: row.payment.currency,
    frisbiiRefs: {
      sessionId: row.payment.sessionId,
      chargeId: row.payment.chargeId,
      invoiceHandle: row.payment.invoiceHandle,
      transactionId: row.payment.transactionId,
    },
    createdAt: row.payment.createdAt.toISOString(),
    updatedAt: row.payment.updatedAt.toISOString(),
  };
}
