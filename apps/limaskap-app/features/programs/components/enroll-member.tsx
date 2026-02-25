"use client";

import { type FormEvent, useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEnrollment } from "@/features/programs/server/actions/enrollments";
import type { UserEnrollmentDto } from "@/features/profile/server/contracts";
import type { UserMember } from "@/features/profile/types";
import { calculateAge } from "@/lib/utils";
import { Mars, Venus } from "lucide-react";
import { toast } from "sonner";

type EnrollMemberProps = {
  programId: number;
  members: UserMember[];
  enrollments: UserEnrollmentDto[];
};

export default function EnrollMember({
  programId,
  members,
  enrollments,
}: EnrollMemberProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const enrolledMemberIds = new Set(
    enrollments
      .filter(
        (enrollment) =>
          enrollment.programId === programId &&
          enrollment.enrollmentStatus !== "CANCELLED",
      )
      .map((enrollment) => enrollment.memberRecordId),
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!selectedMemberId) {
      toast.error("Please select a member");
      return;
    }

    startTransition(async () => {
      const result = await createEnrollment(
        programId,
        Number.parseInt(selectedMemberId, 10),
      );

      if (result.error || !result.data) {
        toast.error(result.message || "Enrollment failed");
        return;
      }

      window.location.assign(result.data.checkoutUrl);
    });
  };

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
                      ({calculateAge(String(member.birthDate))} years)
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
      <Button
        type="submit"
        className="mt-4"
        disabled={!selectedMemberId || isPending}
      >
        {isPending ? "Melda til..." : "Melda til"}
      </Button>
    </form>
  );
}
