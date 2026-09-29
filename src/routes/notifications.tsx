import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SignedShell } from "@/components/signed-shell";
import { UserAvatar } from "@/components/user-avatar";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/nyxoshi/server";
import { relativeTime } from "@/lib/nyxoshi/time";
import type { NotificationCard } from "@/lib/nyxoshi/types";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <SignedShell>
      <NotificationsInner />
    </SignedShell>
  );
}

function NotificationsInner() {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
  });

  useEffect(() => {
    void markNotificationsRead().then(() => {
      void queryClient.invalidateQueries({ queryKey: ["unread"] });
    });
  }, [queryClient]);

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur-sm">
        <h1 className="font-display text-xl tracking-tight">Alertas</h1>
      </header>
      {list.data && list.data.length > 0 ? (
        <ul>
          {list.data.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="px-6 py-16 text-center text-sm text-muted">
          Nada novo por enquanto. Curtidas, comentários e novos seguidores
          aparecem aqui.
        </p>
      )}
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationCard }) {
  const copy =
    item.type === "like" ? "curtiu sua publicação" :
    item.type === "comment" ? "comentou sua publicação" :
    item.type === "follow" ? "começou a seguir você" :
    item.type === "repost" ? "repostou sua publicação" :
    item.type === "quote" ? "citou sua publicação" :
    item.type === "mention" ? "mencionou você" : "reagiu à sua publicação";

  const inner = (
    <>
      <UserAvatar
        username={item.actor.username}
        displayName={item.actor.displayName}
        image={item.actor.image}
        toProfile={false}
      />
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium">{item.actor.displayName}</span>{" "}
          <span className="text-muted">{copy}</span>
        </p>
        <p className="text-xs text-subtle">{relativeTime(item.createdAt)}</p>
      </div>
    </>
  );

  return (
    <li className="border-b border-border">
      {item.postId ? (
        <Link
          to="/post/$postId"
          params={{ postId: item.postId }}
          className="flex items-center gap-3 px-4 py-4"
        >
          {inner}
        </Link>
      ) : (
        <Link
          to="/u/$username"
          params={{ username: item.actor.username }}
          className="flex items-center gap-3 px-4 py-4"
        >
          {inner}
        </Link>
      )}
    </li>
  );
}
