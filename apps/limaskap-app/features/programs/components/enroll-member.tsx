"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  getApiUserMembersOptions,
  getApiUserEnrollmentsOptions,
} from "@/lib/sdk/@tanstack/react-query.gen";
import type { UserEnrollmentDto } from "@/features/profile/server/contracts";
import type { UserMember } from "@/features/profile/types";
import { calculateAge, formatApiError } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Mars, Venus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { postApiEnrollments } from "@/lib/sdk";

type EnrollmentCheckoutResponse = {
  checkoutUrl: string;
};

export default function EnrollMember({ programId }: { programId: number }) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const {
    data: membersRaw,
    error,
    isLoading,
  } = useQuery({ ...getApiUserMembersOptions() });

  const { data: enrollmentsRaw } = useQuery({
    ...getApiUserEnrollmentsOptions(),
  });
  const members = (membersRaw as UserMember[] | undefined) ?? [];
  const enrollments = (enrollmentsRaw as UserEnrollmentDto[] | undefined) ?? [];

  const enrolledMemberIds = new Set(
    enrollments
      ?.filter(
        (e) => e.programId === programId && e.enrollmentStatus !== "CANCELLED"
      )
      .map((e) => e.memberRecordId) ?? []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId) {
      toast.error("Please select a member");
      return;
    }

    const { data: result, error: enrollmentError } = await postApiEnrollments({
      body: {
        programId,
        memberId: parseInt(selectedMemberId, 10),
      },
    } as never);

    if (enrollmentError) {
      toast.error(formatApiError(enrollmentError));
      return;
    }

    window.location.assign((result as EnrollmentCheckoutResponse).checkoutUrl);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
        <SelectTrigger className="mt-2">
          <SelectValue placeholder="Choose a member" />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => {
            const isEnrolled = enrolledMemberIds.has(member.id);
            return (
              <SelectItem
                key={member.id}
                value={member.id.toString()}
                disabled={isEnrolled}
              >
                <div className="flex items-center gap-2">
                  {member.gender === "male" ? (
                    <Mars className="h-4 w-4" />
                  ) : (
                    <Venus className="h-4 w-4" />
                  )}
                  {member.firstName} {member.lastName}
                  {member.birthDate && (
                    <span className="text-muted-foreground text-sm">
                      ({calculateAge(member.birthDate)} years)
                    </span>
                  )}
                  {isEnrolled && (
                    <span className="text-muted-foreground text-sm">
                      (Er tilmeldaður)
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Button type="submit" className="mt-4" disabled={!selectedMemberId}>
        Melda til
      </Button>
    </form>
  );
}
