"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { UserMember } from "@/features/profile/types";
import { useQuery } from "@tanstack/react-query";
import { getApiUserMembersOptions } from "@/lib/sdk/@tanstack/react-query.gen";
import type { ProgramDto } from "@/features/programs/server/contracts";
import { useState, useTransition } from "react";
import { createEnrollment } from "@/features/programs/server/actions/enrollments";
import { toast } from "sonner";
import { Mars, Venus } from "lucide-react";
import { calculateAge } from "@/lib/utils";

type EnrollMemberDialogProps = {
  program: ProgramDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EnrollMemberDialog({
  program,
  open,
  onOpenChange,
}: EnrollMemberDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const {
    data: membersRaw,
    error,
    isLoading,
  } = useQuery({ ...getApiUserMembersOptions() });
  const members = (membersRaw as UserMember[] | undefined) ?? [];

  const selectedMember = members.find(
    (member) => member.id.toString() === selectedMemberId
  );

  const handleEnroll = () => {
    if (!selectedMemberId) {
      toast.error("Please select a member to enroll");
      return;
    }

    startTransition(async () => {
      const result = await createEnrollment(
        program.id,
        parseInt(selectedMemberId)
      );

      if (result.error) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        onOpenChange(false);
        setSelectedMemberId("");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMemberId("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll Member</DialogTitle>
          <DialogDescription>
            Select a member to enroll in &quot;{program.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Selection */}
          <div>
            <label className="text-sm font-medium">Select Member</label>
            {isLoading ? (
              <div className="mt-2 p-3 border rounded-md">
                Loading members...
              </div>
            ) : error ? (
              <div className="mt-2 p-3 border rounded-md text-destructive">
                Error loading members: {error.message}
              </div>
            ) : members.length === 0 ? (
              <div className="mt-2 p-3 border rounded-md text-muted-foreground">
                No members found. Please create a member first.
              </div>
            ) : (
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
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
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Member Details */}
          {selectedMember && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </h4>
                    {selectedMember.gender === "male" ? (
                      <Mars className="h-4 w-4" />
                    ) : (
                      <Venus className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {selectedMember.relationshipToUser && (
                      <p>Relationship: {selectedMember.relationshipToUser}</p>
                    )}
                    {selectedMember.birthDate && (
                      <p>Age: {calculateAge(selectedMember.birthDate)} years</p>
                    )}
                    {selectedMember.city && <p>City: {selectedMember.city}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedMemberId || isPending || !members.length}
          >
            {isPending ? "Enrolling..." : "Enroll Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
