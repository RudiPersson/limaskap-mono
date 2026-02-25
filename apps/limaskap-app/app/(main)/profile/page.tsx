import UserEnrollments from "@/features/profile/components/user-enrollments";
import UserEnrollmentsSkeleton from "@/features/profile/components/skeletons/user-enrollments-skeleton";
import UserMembers from "@/features/profile/components/user-members";
import { getUserMembers } from "@/features/profile/server/service";

import { getServerViewer } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProfilePage() {
  const viewer = await getServerViewer();
  if (!viewer) {
    redirect("/sign-in");
  }
  const members = await getUserMembers(viewer);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <UserMembers initialMembers={members} />

      <Suspense fallback={<UserEnrollmentsSkeleton />}>
        <UserEnrollments />
      </Suspense>
    </div>
  );
}
