import { z } from "zod";

import {
  createEnrollmentSchema,
  selectEnrollmentSchema,
} from "@/lib/server/db/schema/enrollment";
import { checkoutResponseSchema } from "@/lib/server/frisbii/checkout";

export const createEnrollmentWithCheckoutInputSchema = createEnrollmentSchema;

export type CreateEnrollmentWithCheckoutInput = z.infer<
  typeof createEnrollmentWithCheckoutInputSchema
>;
export type EnrollmentRecord = z.infer<typeof selectEnrollmentSchema>;
export type EnrollmentCheckoutDto = z.infer<typeof checkoutResponseSchema>;
