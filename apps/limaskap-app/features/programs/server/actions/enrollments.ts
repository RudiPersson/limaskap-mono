"use server";

import { getAuthHeaders } from "@/lib/auth-headers";
import { postApiEnrollments } from "@/lib/sdk";
import { formatApiError } from "@/lib/utils";

export async function createEnrollment(programId: number, memberId: number) {
    const authHeaders = await getAuthHeaders();

    const { error, data: result } = await postApiEnrollments({
        body: {
            programId,
            memberId,
        },
        headers: authHeaders,
    });

    if (error) {
        // Handle specific error cases - check if it's a 409 conflict error
        if ("message" in error && error.message?.includes("already exists")) {
            return {
                error: true,
                message: "This member is already enrolled in this program.",
            };
        }

        return {
            error: true,
            message: formatApiError(error),
        };
    }

    return {
        error: false,
        message: "Member enrolled successfully!",
        data: result,
    };
}
