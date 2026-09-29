import { z } from "zod";

export const createPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva alguma coisa.")
    .max(500, "Máximo de 500 caracteres."),
});

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().optional().nullable(),
  body: z
    .string()
    .trim()
    .min(1, "Escreva um comentário.")
    .max(300, "Máximo de 300 caracteres."),
});

const mediaSource = z.string().trim().max(6_000_000).refine((value) => {
  if (!value) return true;
  if (value.startsWith("data:image/")) return true;
  try { new URL(value); return true; } catch { return false; }
}, "Use uma URL de imagem válida ou um arquivo de imagem enviado pelo próprio perfil.");

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Informe um nome.").max(40, "Máximo de 40 caracteres."),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, "Use 3–20 caracteres: a–z, 0–9 e _."),
  bio: z.string().trim().max(160, "Máximo de 160 caracteres."),
  image: mediaSource.optional().or(z.literal("")),
  bannerUrl: mediaSource.optional().or(z.literal("")),
  profileGifUrl: mediaSource.optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const reportSchema = z.object({
  targetUserId: z.string().optional(),
  targetPostId: z.string().optional(),
  targetMessageId: z.string().optional(),
  reason: z
    .string()
    .trim()
    .min(8, "Descreva o motivo.")
    .max(400, "Máximo de 400 caracteres."),
});

export const feedQuerySchema = z.object({
  tab: z.enum(["forYou", "following"]).default("forYou"),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
});


export const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().trim().min(1, "Escreva uma mensagem.").max(2000, "Máximo de 2000 caracteres."),
  replyToId: z.string().nullable().optional(),
});

export const messageDecisionSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["accept", "decline", "spam"]),
});

export const moderationSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(["ban", "unban", "mute", "unmute", "shadow_ban", "shadow_unban", "expel"]),
  reason: z.string().trim().max(400).optional(),
  durationHours: z.number().int().positive().max(8760).optional(),
});

export const roleSchema = z.object({
  targetUserId: z.string().min(1),
  role: z.enum(["user", "tester", "bug_tester", "designer", "contributor", "vip", "moderator", "admin", "sub_founder"]),
  founderNumber: z.number().int().min(1).max(3).optional(),
});


export const reactionSchema = z.object({ id: z.string().min(1), reaction: z.string().trim().min(1).max(24) });
export const quotePostSchema = z.object({ postId: z.string().min(1), body: z.string().trim().min(1).max(500) });
export const searchPeopleSchema = z.object({ q: z.string().trim().min(1).max(80) });


export const reportDecisionSchema = z.object({
  reportId: z.string().min(1),
  decision: z.enum(["dismiss", "warning", "mute", "ban", "shadow_ban", "delete_content"]),
  reason: z.string().trim().max(400).optional(),
  durationHours: z.number().int().positive().max(8760).optional(),
});

export const reportModeratorSchema = z.object({
  userId: z.string().trim().min(1),
  enabled: z.boolean(),
});
