import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/server/constants";
import { NotFoundDomainError, ValidationDomainError } from "@/lib/server/errors";

export class UserMemberNotFoundError extends NotFoundDomainError {
  constructor(message = "Not Found") {
    super(message);
    this.name = "UserMemberNotFoundError";
  }
}

export class UserMemberUpdatesRequiredError extends ValidationDomainError {
  constructor() {
    super("No updates provided", {
      success: false,
      error: {
        issues: [
          {
            code: ZOD_ERROR_CODES.INVALID_UPDATES,
            path: [],
            message: ZOD_ERROR_MESSAGES.NO_UPDATES,
          },
        ],
        name: "ZodError",
      },
    });

    this.name = "UserMemberUpdatesRequiredError";
  }
}
