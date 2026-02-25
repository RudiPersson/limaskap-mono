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
import type { UserMember } from "@/features/profile/types";

type EditMemberDialogProps = {
  member: UserMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (member: UserMember) => void;
};

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onUpdated,
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
        <EditMemberForm
          member={member}
          onUpdated={onUpdated}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
