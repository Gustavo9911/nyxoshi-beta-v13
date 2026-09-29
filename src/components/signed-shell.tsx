import { type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Landing } from "@/components/landing";
import { Logo } from "@/components/logo";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useMe } from "@/hooks/use-me";

export function SignedShell({
  children,
  guest = "redirect",
}: {
  children: ReactNode;
  guest?: "redirect" | "landing";
}) {
  const { sessionPending, user, me, meLoading } = useMe();

  if (sessionPending || meLoading) {
    return (
      <div className="night-wash grid min-h-dvh place-items-center px-5">
        <div className="text-center">
          <Logo className="justify-center" />
          <p className="mt-4 text-sm text-muted">Abrindo a noite…</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return guest === "landing" ? <Landing /> : <RedirectToSignIn />;
  }
  if (!me) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted">
        Não foi possível carregar o perfil.
      </div>
    );
  }
  return <AppShell me={me}>{children}</AppShell>;
}
