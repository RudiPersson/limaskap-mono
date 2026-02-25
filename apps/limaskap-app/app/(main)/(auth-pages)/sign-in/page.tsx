import { Suspense } from "react";

import SignInForm from "@/features/auth/components/forms/signIn-form";

export default function SignIn() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
