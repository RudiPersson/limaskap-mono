import { randomUUID } from "node:crypto";

import { createEnrollmentWithCheckoutInputSchema } from "@/features/enrollments/server/contracts";
import {
  DuplicateEnrollmentError,
  MemberOwnershipError,
} from "@/features/enrollments/server/errors";
import * as repository from "@/features/enrollments/server/repository";
import {
  NotFoundDomainError,
  ValidationDomainError,
  toZodErrorPayload,
} from "@/lib/server/errors";
import { createHostedCheckout } from "@/lib/server/frisbii/checkout";
import { assertViewer, ViewerContext } from "@/lib/server/session";

export async function listEnrollments() {
  return repository.listEnrollments();
}

export async function getEnrollmentById(id: number) {
  return repository.getEnrollmentById(id);
}

export async function getEnrollmentByInvoiceHandle(invoiceHandle: string) {
  return repository.getEnrollmentByInvoiceHandle(invoiceHandle);
}

export async function createEnrollmentWithCheckout(
  viewer: ViewerContext | null,
  input: unknown,
) {
  assertViewer(viewer);

  const parsed = createEnrollmentWithCheckoutInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  const enrollment = parsed.data;

  const existingEnrollment = await repository.getExistingEnrollment(
    enrollment.programId,
    enrollment.memberId,
  );

  if (existingEnrollment) {
    throw new DuplicateEnrollmentError();
  }

  const memberRecordData = await repository.getMemberWithUser(enrollment.memberId);

  if (!memberRecordData || memberRecordData.member_record.userId !== viewer.userId) {
    throw new MemberOwnershipError();
  }

  const programData = await repository.getProgramWithOrganization(enrollment.programId);

  if (!programData || !programData.organization) {
    throw new NotFoundDomainError("Program not found");
  }

  if (!programData.organization.paymentApiKey) {
    throw new NotFoundDomainError("Payment API key not found");
  }

  const paymentHandle = `program-${enrollment.programId}-${randomUUID()}`;
  const baseUrl = `https://${programData.organization.subdomain}.limaskap.fo`;
  const successUrl = `${baseUrl}/payment/success?handle=${paymentHandle}`;
  const cancelUrl = `${baseUrl}/payment/cancel?handle=${paymentHandle}`;

  const checkout = await createHostedCheckout({
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

  await repository.createEnrollment({
    ...enrollment,
    invoiceHandle: paymentHandle,
  });

  return checkout;
}
