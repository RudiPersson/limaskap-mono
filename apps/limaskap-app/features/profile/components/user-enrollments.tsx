import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserEnrollmentDto } from "@/features/profile/server/contracts";
import { getUserEnrollments } from "@/features/profile/server/service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServerViewer } from "@/lib/server/session";
import { formatPrice } from "@/lib/utils";
import React from "react";

type Enrollment = UserEnrollmentDto;

function getStatusDisplay(status: Enrollment["enrollmentStatus"]) {
  switch (status) {
    case "CONFIRMED":
      return { text: "Active", className: "bg-green-100 text-green-800" };
    case "WAITLISTED":
      return { text: "Waitlisted", className: "bg-yellow-100 text-yellow-800" };
    case "CANCELLED":
      return { text: "Cancelled", className: "bg-red-100 text-red-800" };
    default:
      return { text: status, className: "bg-gray-100 text-gray-800" };
  }
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate).toLocaleDateString();
  const end = new Date(endDate).toLocaleDateString();
  return `${start} - ${end}`;
}

export default async function UserEnrollments() {
  const viewer = await getServerViewer();
  let enrollments: Enrollment[] = [];
  let error: Error | null = null;

  if (!viewer) {
    error = new Error("Unauthorized");
  } else {
    try {
      enrollments = await getUserEnrollments(viewer);
    } catch (caught) {
      error = caught instanceof Error ? caught : new Error("Unknown error");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tilmeldingar</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            <p className="font-medium">Error loading enrollments</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signed Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => {
                const statusDisplay = getStatusDisplay(
                  enrollment.enrollmentStatus
                );
                return (
                  <TableRow key={enrollment.enrollmentId}>
                    <TableCell className="font-medium">
                      {enrollment.memberRecordName}
                    </TableCell>
                    <TableCell>{enrollment.programName}</TableCell>
                    <TableCell>
                      {formatDateRange(
                        enrollment.startDate,
                        enrollment.endDate
                      )}
                    </TableCell>
                    <TableCell>
                      {formatPrice(enrollment.programPrice)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}
                      >
                        {statusDisplay.text}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(enrollment.signedUpAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
