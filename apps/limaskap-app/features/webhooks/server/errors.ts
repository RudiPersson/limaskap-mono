import { UnauthorizedDomainError } from "@/lib/server/errors";

export class InvalidWebhookSignatureError extends UnauthorizedDomainError {
  constructor() {
    super("Unauthorized");
    this.name = "InvalidWebhookSignatureError";
  }
}
