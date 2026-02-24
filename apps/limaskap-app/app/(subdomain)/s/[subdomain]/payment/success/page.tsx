"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiEnrollmentsInvoiceByInvoiceHandleOptions } from "@/lib/sdk/@tanstack/react-query.gen";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Calendar, DollarSign, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

function getPaymentStatusDisplay(
  status: "NONE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED"
) {
  switch (status) {
    case "PAID":
      return { text: "Paid", className: "bg-green-100 text-green-800" };
    case "PENDING":
      return { text: "Pending", className: "bg-yellow-100 text-yellow-800" };
    case "FAILED":
      return { text: "Failed", className: "bg-red-100 text-red-800" };
    case "REFUNDED":
      return { text: "Refunded", className: "bg-blue-100 text-blue-800" };
    default:
      return { text: "None", className: "bg-gray-100 text-gray-800" };
  }
}

function getInvoiceStatusDisplay(
  status:
    | "CREATED"
    | "PENDING"
    | "DUNNING"
    | "SETTLED"
    | "CANCELLED"
    | "AUTHORIZED"
    | "FAILED"
) {
  switch (status) {
    case "SETTLED":
      return { text: "Settled", className: "bg-green-100 text-green-800" };
    case "PENDING":
      return { text: "Pending", className: "bg-yellow-100 text-yellow-800" };
    case "AUTHORIZED":
      return { text: "Authorized", className: "bg-blue-100 text-blue-800" };
    case "FAILED":
      return { text: "Failed", className: "bg-red-100 text-red-800" };
    case "CANCELLED":
      return { text: "Cancelled", className: "bg-gray-100 text-gray-800" };
    default:
      return { text: status, className: "bg-gray-100 text-gray-800" };
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle");

  const {
    data: invoice,
    error: invoiceError,
    isLoading,
  } = useQuery({
    ...getApiEnrollmentsInvoiceByInvoiceHandleOptions({
      path: { invoiceHandle: handle ?? "" },
    }),
    enabled: !!handle,
    refetchInterval: (query) => {
      // Poll every 3 seconds if payment is still pending
      const invoice = query.state.data;
      if (invoice && invoice.invoiceStatus !== "SETTLED") {
        return 3000; // 3 seconds
      }
      // Stop polling once payment is settled or failed
      return false;
    },
  });

  if (!handle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>Invoice handle is required.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Fetching invoice information...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {invoiceError instanceof Error
                ? invoiceError.message
                : "An error occurred while fetching the invoice"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Not Found</CardTitle>
            <CardDescription>
              The enrollment could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const paymentStatusDisplay = getPaymentStatusDisplay(invoice.paymentStatus);
  const invoiceStatusDisplay = getInvoiceStatusDisplay(invoice.invoiceStatus);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle>Payment Successful</CardTitle>
              <CardDescription>
                Your enrollment has been confirmed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Amount */}
            {invoice.amount !== null && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(invoice.amount)}
                  </p>
                </div>
              </div>
            )}

            {/* Sign Up Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Signed Up</p>
                <p className="font-medium">
                  {new Date(invoice.signedUpAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-5" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentStatusDisplay.className}`}
                >
                  {paymentStatusDisplay.text}
                </span>
              </div>
            </div>

            {/* Invoice Status */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-5" />
              <div>
                <p className="text-sm text-muted-foreground">Invoice Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${invoiceStatusDisplay.className}`}
                >
                  {invoiceStatusDisplay.text}
                </span>
              </div>
            </div>

            {/* Invoice Handle */}
            <div className="flex items-center gap-3 md:col-span-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Invoice Handle</p>
                <p className="font-mono text-sm break-all">
                  {invoice.invoiceHandle}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
