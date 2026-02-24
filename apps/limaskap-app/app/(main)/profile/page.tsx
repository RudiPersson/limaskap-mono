import UserEnrollments from "@/features/profile/components/user-enrollments";
import UserEnrollmentsSkeleton from "@/features/profile/components/skeletons/user-enrollments-skeleton";
import UserMembers from "@/features/profile/components/user-members";

import { getUserDto } from "@/lib/data/user/user-dto";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProfilePage() {
  // Check authentication
  const user = await getUserDto();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <UserMembers />

      <Suspense fallback={<UserEnrollmentsSkeleton />}>
        <UserEnrollments />
      </Suspense>
    </div>
  );
}
