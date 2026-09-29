import { useQuery } from "@tanstack/react-query";
import { Compass, Sparkles } from "lucide-react";
import { useState } from "react";
import { Compose } from "@/components/compose";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFeed } from "@/lib/nyxoshi/server";
import type { FeedTab, Profile } from "@/lib/nyxoshi/types";
import { UserAvatar } from "@/components/user-avatar";



export function Feed({ me }: { me: Profile }) {
  const [tab, setTab] = useState<FeedTab>("forYou");
  const feed = useQuery({ queryKey: ["feed", tab], queryFn: () => getFeed({ data: { tab } }) });

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border bg-[#09060dcc] px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl tracking-tight">Início</h1>
          <button type="button" className="grid size-9 place-items-center rounded-full text-muted hover:bg-secondary hover:text-fg" aria-label="Explorar">
            <Compass className="size-5" />
          </button>
        </div>

      </header>

      <div className="border-b border-border p-3">
        <div className="nyx-panel rounded-2xl p-3">
          <div className="flex gap-3">
            <UserAvatar username={me.username} displayName={me.displayName} image={me.image} toProfile={false} className="size-10" />
            <div className="min-w-0 flex-1">
              <Compose me={me} compact />
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FeedTab)}>
        <TabsList className="sticky top-[143px] z-10 mx-3 mt-3 grid w-auto grid-cols-2 rounded-xl border border-border bg-[#0e0a18ee] p-1 backdrop-blur-xl md:top-[69px]">
          <TabsTrigger value="forYou" className="rounded-lg">Para você</TabsTrigger>
          <TabsTrigger value="following" className="rounded-lg">Seguindo</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {feed.isLoading ? <FeedSkeleton /> : feed.data && feed.data.length > 0 ? feed.data.map((post) => (
            <PostCard key={post.id} post={post} viewerId={me.userId} onChanged={() => void feed.refetch()} />
          )) : <EmptyFeed tab={tab} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyFeed({ tab }: { tab: FeedTab }) {
  return (
    <div className="px-8 py-20 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-300 nyx-glow"><Sparkles className="size-6" /></div>
      <p className="mt-5 font-display text-2xl tracking-tight">{tab === "following" ? "Ainda sem vozes próximas." : "A noite está quieta."}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{tab === "following" ? "Siga pessoas para montar o seu recorte da Nyxoshi." : "Seja a primeira voz. Uma frase já acende o feed."}</p>
    </div>
  );
}

export function FeedSkeleton() {
  return <div className="divide-y divide-border">{Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="flex gap-3 px-4 py-4"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div></div>
  ))}</div>;
}
