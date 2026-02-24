import UserMembers from "@/features/profile/components/user-members";

import { getUserDto } from "@/lib/data/user/user-dto";
import { protocol, rootDomain } from "@/lib/utils";

import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getUserDto();

  if (!user) {
    redirect(`${protocol}://${rootDomain}/sign-in`);
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <UserMembers />

      {/* <Suspense fallback={<UserEnrollmentsSkeleton />}>
        <UserEnrollments />
      </Suspense> */}
    </div>
  );
}
