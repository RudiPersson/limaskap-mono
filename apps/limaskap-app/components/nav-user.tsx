"use client";
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { BadgeCheck, LogOut, UserIcon } from "lucide-react";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { protocol, rootDomain } from "@/lib/utils";
export default function NavUser() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onError: (ctx) => {
          console.log(ctx.error.message);
        },
        onSuccess: () => {
          console.log("You've logged out. See you soon!");
          setUser(null); // Clear user state in context
          router.push("/");
        },
      },
    });
  }

  // const { data: session, isPending } = useSession();
  const { user, setUser } = useUser();

  return (
    <>
      {!user ? (
        <>
          <a
            href={`${protocol}://${rootDomain}/sign-in`}
          >
            <Button variant={"outline"} size={"sm"}>
              Rita inn
            </Button>
          </a>

          <a href={`${protocol}://${rootDomain}/register`}>
            <Button size={"sm"}>Stovna brúkara</Button>
          </a>
        </>
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarFallback className="rounded-lg">
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={"bottom"}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      <UserIcon />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* <a href="https://www.limaskap.fo/profile"> */}
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                {/* </a> */}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup> */}

              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Rita út
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </>
  );
}
