"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateMemberForm } from "@/features/profile/components/forms/create-member-form";

import { Plus } from "lucide-react";

export function CreateMemberDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"}>
          <Plus className="mr-1 h-4 w-4" />
          Stovna
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Member</DialogTitle>
          <DialogDescription>
            Add a new family member to your account. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <CreateMemberForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
