import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getAuthMode } from "@/lib/auth-mode";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  // No Clerk (demo mode): there is nothing to sign in to.
  if (getAuthMode() !== "clerk") redirect("/dashboard");
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
