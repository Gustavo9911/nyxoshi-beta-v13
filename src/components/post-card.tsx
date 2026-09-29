import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Flag, Repeat2, Bookmark, Quote, Copy, Shield } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/nyxoshi/time";
import type { PostCard as PostCardType } from "@/lib/nyxoshi/types";
import { createReport, createQuote, deletePost, toggleLike, toggleReaction, toggleRepost, toggleBookmark } from "@/lib/nyxoshi/server";
import { cn } from "@/lib/utils";


function RoleBadge({role, founderNumber}:{role?:string; founderNumber?:number|null}) {
  if (!role || role === "user") return null;
  const label = role === "founder" ? `Fundador ${founderNumber ?? ""}`.trim() : role === "angel_girl" ? "Angel Girl" : role === "supreme_archmage" ? "Supremo Arquimago" : role === "sub_founder" ? "Sub Fundador" : role === "hardware_scientist" ? "Maluco Cientista de Hardware com Farofa" : role.replaceAll("_"," ");
  return <span title={label} className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] text-fuchsia-200"><Shield className="size-3" />{role === "founder" ? `F${founderNumber ?? ""}` : role === "angel_girl" ? "🪽 Mika" : role === "supreme_archmage" ? "◈" : role === "sub_founder" ? "SF" : role === "hardware_scientist" ? "🧪" : role}</span>;
}

export function PostCard({
  post,
  viewerId,
  onChanged,
}: {
  post: PostCardType;
  viewerId: string | null;
  onChanged?: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMine = viewerId === post.author.userId;
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likeCount);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [reposted, setReposted] = useState(post.repostedByMe);
  const [reposts, setReposts] = useState(post.repostCount);
  const [bookmarked, setBookmarked] = useState(post.bookmarkedByMe);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteBody, setQuoteBody] = useState("");

  async function onLike() {
    if (!viewerId) {
      navigate({ to: "/login" });
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const result = await toggleLike({ data: post.id });
      setLiked(result.liked);
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      onChanged?.();
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
      toast.error("Não foi possível curtir.");
    }
  }


  async function onRepost() {
    if (!viewerId) { navigate({ to: "/login" }); return; }
    const next=!reposted; setReposted(next); setReposts(n=>n+(next?1:-1));
    try { const r=await toggleRepost({data:post.id}); setReposted(r.reposted); void queryClient.invalidateQueries({queryKey:["feed"]}); }
    catch { setReposted(!next); setReposts(n=>n+(next?-1:1)); toast.error("Não foi possível repostar."); }
  }
  async function onBookmark() {
    if (!viewerId) { navigate({ to: "/login" }); return; }
    const next=!bookmarked; setBookmarked(next);
    try { const r=await toggleBookmark({data:post.id}); setBookmarked(r.bookmarked); toast.success(r.bookmarked?"Salvo nos seus favoritos.":"Removido dos favoritos."); }
    catch { setBookmarked(!next); toast.error("Não foi possível salvar."); }
  }
  async function onQuote() {
    if (!quoteBody.trim()) return; setBusy(true);
    try { await createQuote({data:{postId:post.id,body:quoteBody}}); setQuoteBody(""); setQuoteOpen(false); toast.success("Citação publicada."); void queryClient.invalidateQueries({queryKey:["feed"]}); }
    catch(err){ toast.error(err instanceof Error?err.message:"Não foi possível citar."); } finally { setBusy(false); }
  }
  async function copyPostId(){ await navigator.clipboard?.writeText(post.id); toast.success("ID da publicação copiado."); }

  async function onDelete() {
    try {
      await deletePost({ data: post.id });
      toast.success("Publicação apagada.");
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      onChanged?.();
    } catch {
      toast.error("Não foi possível apagar.");
    }
  }

  async function onReport() {
    setBusy(true);
    try {
      await createReport({
        data: { targetPostId: post.id, targetUserId: post.author.userId, reason },
      });
      toast.success("Denúncia enviada.");
      setReportOpen(false);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível denunciar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="border-b border-border px-4 py-4 transition-colors hover:bg-fuchsia-500/[.018]">
      <div className="flex gap-3">
        <UserAvatar
          username={post.author.username}
          displayName={post.author.displayName}
          image={post.author.image}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to="/u/$username"
                params={{ username: post.author.username }}
                className="truncate font-medium text-fg hover:underline"
              >
                {post.author.displayName}
              </Link>
              <div className="flex items-center gap-2"><p className="truncate text-sm text-muted">
                @{post.author.username}
                <span className="text-subtle"> · {relativeTime(post.createdAt)}</span>
              </p><RoleBadge role={post.author.role} founderNumber={post.author.founderNumber}/></div>
            </div>
            {viewerId ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 text-muted">
                    <MoreHorizontal />
                    <span className="sr-only">Mais</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isMine ? (
                    <DropdownMenuItem onSelect={() => void onDelete()}>
                      <Trash2 className="size-4" />
                      Apagar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => setReportOpen(true)}>
                      <Flag className="size-4" />
                      Denunciar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <Link
            to="/post/$postId"
            params={{ postId: post.id }}
            className="mt-2 block whitespace-pre-wrap text-[15px] leading-relaxed text-fg"
          >
            {post.body}
          </Link>
          {post.quotedPost ? <Link to="/post/$postId" params={{postId:post.quotedPost.id}} className="mt-3 block rounded-2xl border border-border bg-secondary/40 p-3 hover:bg-secondary/60"><div className="flex items-center gap-2 text-xs"><strong>{post.quotedPost.author.displayName}</strong><span className="text-muted">@{post.quotedPost.author.username}</span><RoleBadge role={post.quotedPost.author.role} founderNumber={post.quotedPost.author.founderNumber}/></div><p className="mt-2 whitespace-pre-wrap text-sm text-fg">{post.quotedPost.body}</p></Link> : null}
          <div className="mt-3 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => void onLike()}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm transition-colors",
                liked ? "text-like drop-shadow-[0_0_10px_#f472b655]" : "text-muted hover:text-fg",
              )}
            >
              <Heart className={cn("size-4", liked && "fill-current")} />
              <span className="tabular-nums">{likes}</span>
            </button>
            <button type="button" onClick={()=>void onRepost()} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm",reposted?"text-emerald-300":"text-muted hover:text-fg")}><Repeat2 className="size-4"/><span>{reposts}</span></button>
            <button type="button" onClick={()=>setQuoteOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-muted hover:text-fg"><Quote className="size-4"/><span>{post.quoteCount}</span></button>
            <button type="button" onClick={()=>void onBookmark()} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm",bookmarked?"text-fuchsia-300":"text-muted hover:text-fg")}><Bookmark className={cn("size-4",bookmarked&&"fill-current")}/></button>
            <button type="button" onClick={()=>void copyPostId()} className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-muted hover:text-fg"><Copy className="size-4"/></button>
            <button type="button" onClick={()=>{if(!viewerId){navigate({to:"/login"});return;} void toggleReaction({data:{id:post.id,reaction:"like"}}).then(()=>queryClient.invalidateQueries({queryKey:["feed"]})).catch(()=>toast.error("Não foi possível reagir."));}} className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-muted hover:text-fg">✨</button>
            <Link
              to="/post/$postId"
              params={{ postId: post.id }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-muted hover:text-fg"
            >
              <MessageCircle className="size-4" />
              <span className="tabular-nums">{post.commentCount}</span>
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Citar publicação</DialogTitle><DialogDescription>Adicione seu comentário e publique uma citação.</DialogDescription></DialogHeader>
          <Textarea value={quoteBody} onChange={e=>setQuoteBody(e.target.value.slice(0,500))} placeholder="O que você acha?"/>
          <Button onClick={()=>void onQuote()} disabled={busy||!quoteBody.trim()}>Publicar citação</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar publicação</DialogTitle>
            <DialogDescription>
              Conte o que está errado. A equipe avalia cada relato.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo"
            maxLength={400}
          />
          <Button onClick={() => void onReport()} disabled={busy || reason.trim().length < 8}>
            Enviar denúncia
          </Button>
        </DialogContent>
      </Dialog>
    </article>
  );
}
