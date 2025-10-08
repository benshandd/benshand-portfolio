import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth";

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email");
    const password = formData.get("password");
    const redirect = formData.get("redirect") ?? params.redirect ?? "/dashboard";
    if (typeof email !== "string" || typeof password !== "string") {
      return;
    }
    await signIn("credentials", {
      email,
      password,
      redirectTo: typeof redirect === "string" ? redirect : "/dashboard",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--bg))] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access the portfolio dashboard with your credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignIn} className="space-y-4">
            <input type="hidden" name="redirect" value={params.redirect ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-[hsl(var(--fg-muted))]">
            Forgot your password? Contact the site owner for assistance.
          </p>
          <p className="mt-4 text-center text-xs text-[hsl(var(--fg-muted))]">
            <Link href="/" className="underline">
              Back to site
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
