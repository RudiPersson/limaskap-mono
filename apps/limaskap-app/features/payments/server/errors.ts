import { BadRequestDomainError } from "@/lib/server/errors";

export class PaymentProviderDomainError extends BadRequestDomainError {
  constructor(message: string) {
    super(message);
    this.name = "PaymentProviderDomainError";
  }
}
