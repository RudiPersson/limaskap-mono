"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { GetApiProgramsByIdResponse } from "@/lib/sdk";
import { Calendar, Users, DollarSign, Tag } from "lucide-react";
import { useState } from "react";
import EnrollMemberDialog from "@/features/programs/components/enroll-member-dialog";

type ProgramDetailProps = {
  program: GetApiProgramsByIdResponse;
  subdomain: string;
};

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate).toLocaleDateString("sv-SE");
  const end = new Date(endDate).toLocaleDateString("sv-SE");
  return `${start} - ${end}`;
}

export default function ProgramDetail({ program }: ProgramDetailProps) {
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Program Image */}
        {program.image && (
          <div className="w-full h-64 rounded-lg overflow-hidden">
            <img
              src={program.image}
              alt={program.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main Program Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{program.name}</CardTitle>
                {program.description && (
                  <CardDescription className="text-lg mt-2">
                    {program.description}
                  </CardDescription>
                )}
              </div>
              {/* <Button
                onClick={() => setEnrollDialogOpen(true)}
                size="lg"
                className="ml-4"
              >
                Enroll Member
              </Button> */}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Price */}
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Prísur</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(program.price)}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Tíðarskeið</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(program.startDate, program.endDate)}
                  </p>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Luttakarar</p>
                  <p className="text-sm text-muted-foreground">
                    {program.maxParticipants
                      ? `Max ${program.maxParticipants} luttakarar`
                      : "Einki max"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {program.tags && program.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Tags</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {program.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            {/* <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={
                      program.isPublished ? "text-green-600" : "text-yellow-600"
                    }
                  >
                    {program.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stovna:</span>
                  <span>
                    {new Date(program.createdAt).toLocaleDateString("sv-SE")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Seinast dagført:
                  </span>
                  <span>
                    {new Date(program.updatedAt).toLocaleDateString("sv-SE")}
                  </span>
                </div>
              </div>
            </div> */}
          </CardContent>
        </Card>

        {/* Enrollment Dialog */}
        {/* <EnrollMemberDialog
          program={program}
          open={enrollDialogOpen}
          onOpenChange={setEnrollDialogOpen}
        /> */}
      </div>
    </div>
  );
}
