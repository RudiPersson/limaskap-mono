"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMemberDialog } from "@/features/profile/components/create-member-dialog";
import { EditMemberDialog } from "@/features/profile/components/edit-member-dialog";
import type { UserMember } from "@/features/profile/types";
import { calculateAge } from "@/lib/utils";
import { Mars, MoreHorizontal, Pencil, Venus } from "lucide-react";
import React from "react";

type UserMembersProps = {
  initialMembers: UserMember[];
};

export default function UserMembers({ initialMembers }: UserMembersProps) {
  const [members, setMembers] = React.useState<UserMember[]>(initialMembers);
  const [editingMember, setEditingMember] = React.useState<UserMember | null>(
    null,
  );

  const handleCreated = (member: UserMember) => {
    setMembers((previous) => [member, ...previous]);
  };

  const handleUpdated = (member: UserMember) => {
    setMembers((previous) =>
      previous.map((current) => (current.id === member.id ? member : current)),
    );
    setEditingMember(null);
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col">
        <h1 className="text-lg font-bold pb-2">Vanga limir</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                <p>Tú hevur ennå ikki stovnað nakra limi.</p>
                <p className="text-sm">Byrja við at leggja til fyrsta liminn.</p>
              </div>
              <CreateMemberDialog onCreated={handleCreated} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 pb-2">
        <h1 className="leading-none font-semibold ">Vanga limir</h1>
        <CreateMemberDialog onCreated={handleCreated} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                {member.firstName} {member.lastName}{" "}
                <span>
                  {member.gender === "male" ? (
                    <Mars className="size-4" />
                  ) : (
                    <Venus className="size-4" />
                  )}
                </span>
              </CardTitle>

              <CardAction>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingMember(member)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Familieforhold:</span>
                  <span>{member.relationshipToUser || "—"}</span>
                </div>
                {member.birthDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aldur</span>
                    <span>{calculateAge(String(member.birthDate))} ár</span>
                  </div>
                )}
                {member.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Býur</span>
                    <span>{member.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stovnaður</span>
                  <span>
                    {new Date(member.createdAt).toLocaleDateString("sv-SE")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          onUpdated={handleUpdated}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        />
      )}
    </div>
  );
}
