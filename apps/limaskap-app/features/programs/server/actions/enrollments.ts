"use server";

import { createEnrollmentWithCheckout } from "@/features/enrollments/server/service";
import { DomainError } from "@/lib/server/errors";
import { getServerViewer } from "@/lib/server/session";
import { formatApiError } from "@/lib/utils";

export async function createEnrollment(programId: number, memberId: number) {
  const viewer = await getServerViewer();

  try {
    const result = await createEnrollmentWithCheckout(viewer, {
      programId,
      memberId,
    });

    return {
      error: false,
      message: "Member enrolled successfully!",
      data: result,
    };
  } catch (error) {
    if (error instanceof DomainError && error.status === 409) {
      return {
        error: true,
        message: "This member is already enrolled in this program.",
      };
    }

    if (error instanceof DomainError && error.details) {
      return {
        error: true,
        message: formatApiError(error.details as never),
      };
    }

    return {
      error: true,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
