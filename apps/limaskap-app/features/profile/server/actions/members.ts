"use server";

import { createUserMember } from "@/features/profile/server/service";
import { profileMemberSchema } from "@/features/profile/schemas/members";
import { DomainError } from "@/lib/server/errors";
import { getServerViewer } from "@/lib/server/session";
import { formatApiError } from "@/lib/utils";

import { z } from "zod";

export async function createMember(data: z.infer<typeof profileMemberSchema>) {
  const viewer = await getServerViewer();
  try {
    const result = await createUserMember(viewer, data);
    return {
      error: false,
      message: "Member created successfully",
      data: result,
    };
  } catch (error) {
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
