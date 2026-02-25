import { NotFoundDomainError } from "@/lib/server/errors";

export class OrganizationNotFoundError extends NotFoundDomainError {
  constructor(message = "Not Found") {
    super(message);
    this.name = "OrganizationNotFoundError";
  }
}
