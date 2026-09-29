import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Feed } from "@/components/feed";
import { Landing } from "@/components/landing";
import { Logo } from "@/components/logo";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureMyProfile } from "@/lib/nyxoshi/server";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { sessionUser } = Route.useRouteContext();
  const { user, isPending } = useCurrentUserState();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => ensureMyProfile(),
    enabled: Boolean(user),
  });

  const knownGuest = !user && (!isPending || !sessionUser);
  if (knownGuest) return <Landing />;
  if (!user || me.isLoading || !me.data) return <BootScreen />;

  return (
    <AppShell me={me.data}>
      <Feed me={me.data} />
    </AppShell>
  );
}

function BootScreen() {
  return (
    <div className="night-wash grid min-h-dvh place-items-center px-5">
      <div className="text-center">
        <Logo className="justify-center" />
        <p className="mt-4 text-sm text-muted">Abrindo a noite…</p>
      </div>
    </div>
  );
}
