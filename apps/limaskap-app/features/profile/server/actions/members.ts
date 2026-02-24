"use server";

import { profileMemberSchema } from "@/features/profile/schemas/members";
import { getAuthHeaders } from "@/lib/auth-headers";
import { postApiUserMembers } from "@/lib/sdk";
import { formatApiError } from "@/lib/utils";

import { z } from "zod";

export async function createMember(data: z.infer<typeof profileMemberSchema>) {
  const authHeaders = await getAuthHeaders();

  const { error, data: result } = await postApiUserMembers({
    body: data,
    headers: authHeaders,
  });

  if (error) {
    return {
      error: true,
      message: formatApiError(error),
    };
  }

  return {
    error: false,
    message: "Member created successfully",
    data: result,
  };
}
