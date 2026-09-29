import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, Hash, Palette, Code2, Music2, UsersRound } from "lucide-react";
import { SignedShell } from "@/components/signed-shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/communities")({ component: CommunitiesPage });

const communities = [
  { name: "Anime & Mangá", members: "12,4 mil membros", icon: Gamepad2 },
  { name: "Games", members: "8,7 mil membros", icon: Gamepad2 },
  { name: "Programação", members: "5,2 mil membros", icon: Code2 },
  { name: "Tecnologia", members: "4,8 mil membros", icon: Hash },
  { name: "Arte & Design", members: "3,9 mil membros", icon: Palette },
  { name: "Música", members: "3,1 mil membros", icon: Music2 },
];

function CommunitiesPage() {
  return <SignedShell><div>
    <header className="sticky top-0 z-20 border-b border-border bg-[#09060dcc] px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between"><h1 className="font-display text-2xl">Comunidades</h1><UsersRound className="size-5 text-fuchsia-300" /></div>
      <Input className="mt-3 rounded-full bg-secondary" placeholder="Buscar comunidades..." />
    </header>
    <div className="flex gap-2 overflow-x-auto px-4 py-3 nyx-scrollbar">{["Todas", "Anime", "Games", "Tecnologia", "Arte"].map((x, i) => <span key={x} className={`rounded-full px-3 py-1.5 text-xs ${i === 0 ? "bg-primary text-white" : "bg-secondary text-muted"}`}>{x}</span>)}</div>
    <section className="divide-y divide-border">
      {communities.map(({ name, members, icon: Icon }) => <Link key={name} to="/communities" className="flex items-center gap-3 px-4 py-4 hover:bg-white/[.02]">
        <span className="grid size-12 place-items-center rounded-2xl border border-fuchsia-400/15 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/5 text-fuchsia-300"><Icon className="size-5" /></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm">{name}</strong><span className="text-xs text-muted">{members}</span></span>
        <span className="rounded-full border border-fuchsia-400/20 px-3 py-1 text-xs text-fuchsia-200">Entrar</span>
      </Link>)}
    </section>
  </div></SignedShell>;
}
