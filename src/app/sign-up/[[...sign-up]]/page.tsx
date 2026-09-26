import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getAuthMode } from "@/lib/auth-mode";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  // No Clerk (demo mode): there is nothing to sign in to.
  if (getAuthMode() !== "clerk") redirect("/dashboard");
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </main>
  );
}
