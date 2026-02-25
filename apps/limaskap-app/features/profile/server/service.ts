import {
  createUserMemberInputSchema,
  toUserEnrollmentDto,
  updateUserMemberInputSchema,
} from "@/features/profile/server/contracts";
import {
  UserMemberNotFoundError,
  UserMemberUpdatesRequiredError,
} from "@/features/profile/server/errors";
import * as repository from "@/features/profile/server/repository";
import { ValidationDomainError, toZodErrorPayload } from "@/lib/server/errors";
import { assertViewer, ViewerContext } from "@/lib/server/session";

export async function getUserMembers(viewer: ViewerContext | null) {
  assertViewer(viewer);
  return repository.listMembersByUserId(viewer.userId);
}

export async function createUserMember(viewer: ViewerContext | null, input: unknown) {
  assertViewer(viewer);

  const parsed = createUserMemberInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  return repository.createMember({
    ...parsed.data,
    userId: viewer.userId,
  });
}

export async function updateUserMember(
  viewer: ViewerContext | null,
  memberId: number,
  input: unknown,
) {
  assertViewer(viewer);

  const parsed = updateUserMemberInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  if (Object.keys(parsed.data).length === 0) {
    throw new UserMemberUpdatesRequiredError();
  }

  const updated = await repository.updateMember(viewer.userId, memberId, parsed.data);

  if (!updated) {
    throw new UserMemberNotFoundError();
  }

  return updated;
}

export async function getUserEnrollments(viewer: ViewerContext | null) {
  assertViewer(viewer);

  const enrollments = await repository.listUserEnrollments(viewer.userId);
  return enrollments.map(toUserEnrollmentDto);
}
