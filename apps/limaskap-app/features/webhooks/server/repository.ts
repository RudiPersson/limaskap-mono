import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { paymentTable, webhookEventTable } from "@/lib/server/db/schema/payment";
import { programsTable } from "@/lib/server/db/schema/program";

export async function getWebhookContextByInvoiceHandle(invoiceHandle: string) {
  const rows = await db
    .select({
      enrollment: enrollmentTable,
      organization: organizationTable,
    })
    .from(enrollmentTable)
    .innerJoin(programsTable, eq(enrollmentTable.programId, programsTable.id))
    .innerJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .where(eq(enrollmentTable.invoiceHandle, invoiceHandle))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertWebhookEvent(values: typeof webhookEventTable.$inferInsert) {
  await db.insert(webhookEventTable).values(values);
}

export async function updateEnrollmentInvoiceStatus(
  enrollmentId: number,
  invoiceStatus: "CREATED" | "PENDING" | "DUNNING" | "SETTLED" | "CANCELLED" | "AUTHORIZED" | "FAILED",
) {
  await db
    .update(enrollmentTable)
    .set({ invoiceStatus })
    .where(eq(enrollmentTable.id, enrollmentId));
}

export async function updatePaymentStatusForEnrollment(
  enrollmentId: number,
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED",
  invoiceHandle: string,
) {
  await db
    .update(paymentTable)
    .set({
      status,
      invoiceHandle,
    })
    .where(eq(paymentTable.enrollmentId, enrollmentId));
}

export async function updateEnrollmentPaymentStatus(
  enrollmentId: number,
  paymentStatus: "NONE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED",
) {
  await db
    .update(enrollmentTable)
    .set({ paymentStatus })
    .where(eq(enrollmentTable.id, enrollmentId));
}

export async function markWebhookEventProcessed(webhookId: string) {
  await db
    .update(webhookEventTable)
    .set({ processedAt: new Date() })
    .where(eq(webhookEventTable.webhookId, webhookId));
}
