import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { createPost } from "@/lib/nyxoshi/server";
import type { Profile } from "@/lib/nyxoshi/types";
import { cn } from "@/lib/utils";

const MAX = 500;

export function Compose({
  me,
  autoFocus = false,
  compact = false,
  onPosted,
}: {
  me: Profile;
  autoFocus?: boolean;
  compact?: boolean;
  onPosted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const remaining = MAX - body.length;
  const canPost = body.trim().length > 0 && body.length <= MAX && !busy;

  async function submit() {
    if (!canPost) return;
    setBusy(true);
    try {
      await createPost({ data: { body } });
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      onPosted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível publicar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex gap-3", compact ? "py-0" : "border-b border-border px-4 py-4")}>
      {!compact ? <UserAvatar username={me.username} displayName={me.displayName} image={me.image} /> : null}
      <div className="min-w-0 flex-1">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder="O que a noite guarda?"
          autoFocus={autoFocus}
          className={cn("resize-none border-0 p-0 text-[17px] leading-relaxed focus-visible:ring-0", compact ? "min-h-[48px]" : "min-h-[96px]")}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <span
            className={cn(
              "text-xs tabular-nums",
              remaining < 40 ? "text-destructive" : "text-subtle",
            )}
          >
            {remaining}
          </span>
          <Button size="pill" onClick={() => void submit()} disabled={!canPost}>
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
