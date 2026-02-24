import { v4 as uuidv4 } from "uuid";

import { db, schema } from "../index";
import enrollments from "./data/enrollment.json" with { type: "json" };

export default async function seed() {
  await db.insert(schema.enrollmentTable).values(
    enrollments.map((enrollment) => ({
      programId: enrollment.programId,
      memberId: enrollment.memberId,
      status: enrollment.status as "CONFIRMED" | "WAITLISTED" | "CANCELLED",
      paymentStatus: enrollment.paymentStatus as "NONE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED",
      amount: enrollment.amount,
      signedUpAt: new Date(enrollment.signedUpAt),
      invoiceHandle: `program-${enrollment.programId}-${uuidv4()}`,
    }))
  );
}
