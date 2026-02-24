"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditMemberForm } from "@/features/profile/components/forms/edit-member-form";
import type { GetApiUserMembersResponses } from "@/lib/sdk";

type Member = GetApiUserMembersResponses[200][number];

type EditMemberDialogProps = {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
}: EditMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dagfør</DialogTitle>
          <DialogDescription>
            Dagør upplýsingar fyri {member.firstName} {member.lastName}.
          </DialogDescription>
        </DialogHeader>
        <EditMemberForm member={member} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
