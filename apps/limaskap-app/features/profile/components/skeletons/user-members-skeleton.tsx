import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export default function UserMembersSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 pb-2">
        <h1 className="leading-none font-semibold">Vanga limir</h1>
        <Skeleton className="h-10 w-32" /> {/* Create member button skeleton */}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <Skeleton className="h-6 w-20" /> {/* First name */}
                <Skeleton className="h-6 w-24" /> {/* Last name */}
                <Skeleton className="h-4 w-4 rounded-full" />{" "}
                {/* Gender icon */}
              </CardTitle>

              <CardAction>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Familieforhold:</span>
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aldur</span>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Býur</span>
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stovnaður</span>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
