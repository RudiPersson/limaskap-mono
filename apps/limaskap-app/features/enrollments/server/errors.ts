import { ConflictDomainError, UnauthorizedDomainError } from "@/lib/server/errors";

export class DuplicateEnrollmentError extends ConflictDomainError {
  constructor() {
    super("Enrollment already exists for this program and member");
    this.name = "DuplicateEnrollmentError";
  }
}

export class MemberOwnershipError extends UnauthorizedDomainError {
  constructor() {
    super("Member record does not belong to current user");
    this.name = "MemberOwnershipError";
  }
}
