"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

import { ArrowUpDown } from "lucide-react";
import { GetApiOrganizationsResponse } from "@/lib/sdk";
import { protocol, rootDomain } from "@/lib/utils";

export const columns: ColumnDef<GetApiOrganizationsResponse[0]>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const organization = row.original;
      return (
        <a
          href={`${protocol}://${organization.subdomain}.${rootDomain}`}
          className="text-blue-500 hover:underline text-sm"
        >
          {organization.name}
        </a>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "city",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          City
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];
