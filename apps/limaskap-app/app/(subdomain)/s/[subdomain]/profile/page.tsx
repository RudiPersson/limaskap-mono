import UserMembers from "@/features/profile/components/user-members";
import { getUserMembers } from "@/features/profile/server/service";

import { getUserDto } from "@/lib/data/user/user-dto";
import { getServerViewer } from "@/lib/server/session";
import { protocol, rootDomain } from "@/lib/utils";

import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const viewer = await getServerViewer();
  const user = await getUserDto();

  if (!user || !viewer) {
    redirect(`${protocol}://${rootDomain}/sign-in`);
  }
  const members = await getUserMembers(viewer);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <UserMembers initialMembers={members} />

      {/* <Suspense fallback={<UserEnrollmentsSkeleton />}>
        <UserEnrollments />
      </Suspense> */}
    </div>
  );
}
