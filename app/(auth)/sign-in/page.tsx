import { ShieldCheck } from "lucide-react";

import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { isDevelopmentAuthEnabled } from "@/server/services/development-auth";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

function safeCallbackUrl(value: string | undefined) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/account";
}

async function developmentSignIn(formData: FormData) {
  "use server";

  if (!isDevelopmentAuthEnabled()) {
    return;
  }

  await signIn("development", formData);
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const devAuthEnabled = isDevelopmentAuthEnabled();
  const callbackUrl = safeCallbackUrl(params?.callbackUrl);

  return (
    <main className="min-h-screen bg-background px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center gap-8">
        <div className="space-y-3">
          <span className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium uppercase text-accent">
              Secure access
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight text-foreground">
              Sign in to Pobal
            </h1>
          </div>
        </div>

        {devAuthEnabled ? (
          <form action={developmentSignIn} className="space-y-4">
            <input name="redirectTo" type="hidden" value={callbackUrl} />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">
                Email
              </span>
              <input
                autoComplete="email"
                className="h-11 w-full rounded-md border border-input bg-white px-3 text-base text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">
                Name
              </span>
              <input
                autoComplete="name"
                className="h-11 w-full rounded-md border border-input bg-white px-3 text-base text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring"
                name="name"
                placeholder="Your name"
                type="text"
              />
            </label>
            <Button className="w-full" type="submit">
              Continue
            </Button>
            <p className="text-sm leading-6 text-muted-foreground">
              Local development access only. Production sign-in will use a
              configured OAuth provider.
            </p>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-white p-4 text-sm leading-6 text-muted-foreground shadow-sm">
            Development sign-in is disabled. Production OAuth is Microsoft
            Entra-ready when provider credentials are intentionally configured.
          </div>
        )}
      </section>
    </main>
  );
}
