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
import type { UserMember } from "@/features/profile/types";
import { calculateAge } from "@/lib/utils";
// import { getUserMembers } from "@/lib/sdk";
// import { headers } from "next/headers";
import { Mars, MoreHorizontal, Venus, Pencil } from "lucide-react";
import React from "react";
import { CreateMemberDialog } from "@/features/profile/components/create-member-dialog";
import { EditMemberDialog } from "@/features/profile/components/edit-member-dialog";
import { getApiUserMembersOptions } from "@/lib/sdk/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import UserMembersSkeleton from "./skeletons/user-members-skeleton";

export default function UserMembers() {
  const [editingMember, setEditingMember] = React.useState<UserMember | null>(
    null
  );

  const {
    data: members,
    error,
    isLoading,
  } = useQuery({ ...getApiUserMembersOptions() });
  // const { data: members, error } = await getUserMembers({
  //   headers: await headers(),
  // });

  if (isLoading) {
    return <UserMembersSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col p-4">
        <h1 className="text-lg font-bold">Vanga limir</h1>
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          <p className="font-medium">Error loading members</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const safeMembers = (members as UserMember[] | undefined) ?? [];

  // Handle empty state
  if (safeMembers.length === 0) {
    return (
      <div className="flex flex-col">
        <h1 className="text-lg font-bold pb-2">Vanga limir</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                <p>Tú hevur ennå ikki stovnað nakra limi.</p>
                <p className="text-sm">
                  Byrja við at leggja til fyrsta liminn.
                </p>
              </div>
              <CreateMemberDialog />
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
        <CreateMemberDialog />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeMembers.map((member) => (
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
                    <span>{calculateAge(member.birthDate)} ár</span>
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
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        />
      )}
    </div>
  );
}
