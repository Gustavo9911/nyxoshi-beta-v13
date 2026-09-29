import { useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureMyProfile } from "@/lib/nyxoshi/server";

export function useMe() {
  const { user, isPending } = useCurrentUserState();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => ensureMyProfile(),
    enabled: Boolean(user),
  });
  return {
    sessionPending: isPending,
    user,
    me: me.data ?? null,
    meLoading: Boolean(user) && (me.isLoading || !me.data),
  };
}
