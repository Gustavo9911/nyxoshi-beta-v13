import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Flag, VolumeX, ShieldAlert, Copy, MessageCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { SignedShell } from "@/components/signed-shell";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { FeedSkeleton } from "@/components/feed";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-me";
import {
  createReport,
  getProfileByUsername,
  getProfilePosts,
  getProfileReposts,
  getProfileLikes,
  toggleBlock,
  toggleFollow,
  toggleMute,
  toggleRestriction,
  getMessageThreadForUser,
  sendMessage,
} from "@/lib/nyxoshi/server";

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <SignedShell>
      <ProfileInner />
    </SignedShell>
  );
}

function ProfileInner() {
  const { username } = Route.useParams();
  const { me } = useMe();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername({ data: username }),
  });
  const [tab, setTab] = useState<"posts"|"reposts"|"likes">("posts");
  const posts = useQuery({ queryKey:["profile-posts",username], queryFn:()=>getProfilePosts({data:username}), enabled:tab==="posts" });
  const reposts = useQuery({ queryKey:["profile-reposts",username], queryFn:()=>getProfileReposts({data:username}), enabled:tab==="reposts" });
  const likes = useQuery({ queryKey:["profile-likes",username], queryFn:()=>getProfileLikes({data:username}), enabled:tab==="likes" });
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [muted, setMuted] = useState(false);
  const [restricted, setRestricted] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");

  const person = profile.data;
  if (profile.isLoading) return <FeedSkeleton />;
  if (!person) {
    return (
      <p className="px-6 py-16 text-center text-sm text-muted">
        Este perfil não existe.
      </p>
    );
  }
  const targetId = person.userId;

  async function onFollow() {
    try {
      await toggleFollow({ data: targetId });
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível seguir.");
    }
  }

  async function onBlock() {
    try {
      const result = await toggleBlock({ data: targetId });
      toast.success(result.blocked ? "Conta bloqueada." : "Conta desbloqueada.");
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível bloquear.");
    }
  }


  async function onMute(){try{const r=await toggleMute({data:targetId});setMuted(r.muted);toast.success(r.muted?"Conta silenciada.":"Conta não está mais silenciada.");}catch(e){toast.error(e instanceof Error?e.message:"Não foi possível silenciar.");}}
  async function onRestrict(){try{const r=await toggleRestriction({data:targetId});setRestricted(r.restricted);toast.success(r.restricted?"Conta restringida.":"Restrição removida.");}catch(e){toast.error(e instanceof Error?e.message:"Não foi possível restringir.");}}
  async function copyId(){try{if(navigator.clipboard) await navigator.clipboard.writeText(person.permanentId);toast.success("ID permanente copiado.");}catch{toast.error("Não foi possível copiar o ID.");}}

  async function onReport() {
    try {
      await createReport({
        data: { targetUserId: targetId, reason },
      });
      toast.success("Denúncia enviada.");
      setReportOpen(false);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível denunciar.");
    }
  }

  return (
    <div>
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-violet-950 via-fuchsia-950/60 to-black">
        {person.bannerUrl ? <img src={person.bannerUrl} alt="" className="absolute inset-0 size-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]" /> : <div className="absolute inset-0 opacity-60 starfield" />}
        {person.profileGifUrl ? <img src={person.profileGifUrl} alt="" className="absolute right-4 top-4 size-20 rounded-xl object-cover opacity-90" /> : null}
      </div>
      <div className="-mt-10 px-4">
        <UserAvatar
          username={person.username}
          displayName={person.displayName}
          image={person.image || person.profileGifUrl}
          toProfile={false}
          className="size-20 ring-4 ring-bg shadow-[0_0_35px_#a855f755]"
        />
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><h1 className="font-display text-2xl tracking-tight">{person.displayName}</h1>{person.role!=="user"?<span title={person.role==="founder"?`Fundador ${person.founderNumber??""}`:person.role === "angel_girl" ? "🪽 Mika · Angel Girl" : person.role === "supreme_archmage" ? "◈ Supremo Arquimago" : person.role === "sub_founder" ? "✦ Sub Fundador" : person.role === "hardware_scientist" ? "🧪 Maluco Cientista de Hardware com Farofa" : person.role.replaceAll("_"," ")} className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-1 text-xs text-fuchsia-200"><Shield className="size-3.5"/>{person.role==="founder"?`Fundador ${person.founderNumber??""}`:person.role === "angel_girl" ? "🪽 Mika · Angel Girl" : person.role === "supreme_archmage" ? "◈ Supremo Arquimago" : person.role === "sub_founder" ? "✦ Sub Fundador" : person.role === "hardware_scientist" ? "🧪 Maluco Cientista de Hardware com Farofa" : person.role.replaceAll("_"," ")}</span>:null}</div>
            <div className="flex items-center gap-2"><p className="text-sm text-muted">@{person.username} · ID permanente {person.permanentId}</p><button type="button" onClick={()=>void copyId()} className="text-subtle hover:text-fg" title="Copiar ID permanente"><Copy className="size-3.5"/></button></div>
          </div>
          {person.isSelf ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">Editar perfil</Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={person.isFollowing ? "outline" : "default"}
                onClick={() => void onFollow()}
              >
                {person.isFollowing ? "Seguindo" : "Seguir"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9"
                onClick={() => void onBlock()}
                title={person.isBlocked ? "Desbloquear" : "Bloquear"}
              >
                <Ban className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" className="size-9" onClick={()=>void onMute()} title="Silenciar"><VolumeX className="size-4"/></Button>
              <Button size="icon" variant="ghost" className="size-9" onClick={()=>void onRestrict()} title="Restringir"><ShieldAlert className="size-4"/></Button>
              <Button size="icon" variant="ghost" className="size-9" onClick={()=>setMessageOpen(true)} title="Mensagem"><MessageCircle className="size-4"/></Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="size-4" />
              </Button>
            </div>
          )}
        </div>
        {person.websiteUrl ? <a href={person.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-fuchsia-300">{person.websiteUrl}</a> : null}
        {person.bio ? (
          <p className="mt-3 max-w-prose text-sm leading-relaxed">{person.bio}</p>
        ) : null}
        <p className="mt-4 flex gap-6 text-sm">
          <span>
            <strong className="tabular-nums text-fg">{person.following}</strong>{" "}
            <span className="text-muted">seguindo</span>
          </span>
          <span>
            <strong className="tabular-nums text-fg">{person.followers}</strong>{" "}
            <span className="text-muted">seguidores</span>
          </span>
        </p>
      </div>
      <div className="mt-6 border-y border-border bg-[#0b0712]">
        <div className="grid grid-cols-3 text-center text-xs">
          {([["posts","Publicações"],["reposts","Reposts"],["likes","Curtidas"]] as const).map(([key,label])=><button key={key} type="button" onClick={()=>setTab(key)} className={tab===key?"border-b-2 border-fuchsia-400 px-3 py-3 font-medium text-fuchsia-200":"px-3 py-3 text-muted"}>{label}</button>)}
        </div>
        {(() => { const data=tab==="posts"?posts.data:tab==="reposts"?reposts.data:likes.data; return data && data.length > 0 ? data.map((post)=><PostCard key={post.id} post={post} viewerId={me?.userId??null} />) : (
          <p className="px-6 py-12 text-center text-sm text-muted">
            {person.isSelf
              ? "Você ainda não publicou nada."
              : "Nenhuma publicação ainda."}
          </p>
        )})()}
      </div>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar mensagem para {person.displayName}</DialogTitle><DialogDescription>Se ainda não existe uma conversa, sua mensagem será enviada como solicitação. A outra pessoa poderá aceitar, recusar ou marcar como spam.</DialogDescription></DialogHeader>
          <Textarea value={messageBody} onChange={e=>setMessageBody(e.target.value)} maxLength={2000} placeholder="Escreva sua mensagem..." />
          <Button disabled={!messageBody.trim()} onClick={async()=>{try{const r=await sendMessage({data:{recipientId:targetId,body:messageBody.trim()}});setMessageBody("");setMessageOpen(false);toast.success(r.kind==="request"?"Solicitação de mensagem enviada.":"Mensagem enviada.");}catch(e){toast.error(e instanceof Error?e.message:"Não foi possível enviar a mensagem.");}}}>Enviar</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar conta</DialogTitle>
            <DialogDescription>
              Descreva o motivo. Isso não é público.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={400}
          />
          <Button onClick={() => void onReport()} disabled={reason.trim().length < 8}>
            Enviar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
