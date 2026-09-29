import { getSql, type Sql } from "@/lib/db";

export const ROLE_ORDER = [
  "user",
  "hardware_scientist",
  "tester",
  "bug_tester",
  "designer",
  "contributor",
  "vip",
  "moderator",
  "admin",
  "supreme_archmage",
  "sub_founder",
  "founder",
  "angel_girl",
] as const;

export type NyxoshiRole = (typeof ROLE_ORDER)[number];

export const ROLE_META: Record<NyxoshiRole, { label: string; description: string; source: "manual" | "email" | "id" }> = {
  user: { label: "Usuário", description: "Acesso padrão ao Nyxoshi.", source: "manual" },
  hardware_scientist: { label: "Maluco Cientista de Hardware com Farofa", description: "Cargo especial exclusivo com painel próprio de laboratório.", source: "email" },
  tester: { label: "Testador", description: "Participa dos testes da plataforma.", source: "manual" },
  bug_tester: { label: "Testador de Bugs", description: "Ajuda a identificar e reproduzir bugs.", source: "manual" },
  designer: { label: "Designer", description: "Apoia o design e a identidade visual.", source: "manual" },
  contributor: { label: "Contribuidor", description: "Contribui diretamente para o projeto.", source: "manual" },
  vip: { label: "VIP", description: "Cargo especial para membros VIP.", source: "manual" },
  moderator: { label: "Moderador", description: "Modera conteúdo e comunidade.", source: "manual" },
  admin: { label: "Administrador", description: "Administração operacional da plataforma.", source: "manual" },
  supreme_archmage: { label: "Supremo Arquimago", description: "Cargo especial VIP/Contribuidor, um nível abaixo dos Fundadores.", source: "email" },
  sub_founder: { label: "Sub Fundador / Vice Fundador", description: "Divisão abaixo dos Fundadores, atribuída por ID permanente.", source: "id" },
  founder: { label: "Fundador", description: "Fundadores originais #1, #2 e #3.", source: "email" },
  angel_girl: { label: "Angel Girl", description: "Cargo isolado acima de todos os cargos, exclusivo da conta definida por e-mail.", source: "email" },
};

const founderEnvKeys = ["NYXOSHI_FOUNDER_1_EMAIL", "NYXOSHI_FOUNDER_2_EMAIL", "NYXOSHI_FOUNDER_3_EMAIL"] as const;

function normalized(value: string | undefined | null) { return value?.trim().toLowerCase() ?? ""; }

function configuredEmailRole(email: string): { role: NyxoshiRole; founderNumber: number | null; key: string } | null {
  const angel = normalized(process.env.NYXOSHI_ANGEL_GIRL_EMAIL);
  if (angel && email === angel) return { role: "angel_girl", founderNumber: null, key: angel };

  for (let i = 0; i < founderEnvKeys.length; i += 1) {
    const configured = normalized(process.env[founderEnvKeys[i]]);
    if (configured && configured === email) return { role: "founder", founderNumber: i + 1, key: configured };
  }

  const supreme = normalized(process.env.NYXOSHI_SUPREME_ARCHMAGE_EMAIL);
  if (supreme && email === supreme) return { role: "supreme_archmage", founderNumber: null, key: supreme };

  const hardwareScientist = normalized(process.env.NYXOSHI_HARDWARE_SCIENTIST_EMAIL);
  if (hardwareScientist && email === hardwareScientist) return { role: "hardware_scientist", founderNumber: null, key: hardwareScientist };
  return null;
}

export async function syncRoleForUser(sql: Sql, userId: string) {
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId} limit 1`;
  const email = normalized(rows[0]?.email);
  if (!email) return getRole(sql, userId);

  const configured = configuredEmailRole(email);
  const current = await getRole(sql, userId);

  if (current.permanent_ban || current.shadow_banned) return current;

  if (configured) {
    await sql`
      insert into user_roles (user_id, role, founder_number, assignment_source, assignment_key)
      values (${userId}, ${configured.role}, ${configured.founderNumber}, 'email', ${configured.key})
      on conflict (user_id) do update set
        role=${configured.role}, founder_number=${configured.founderNumber}, assignment_source='email', assignment_key=${configured.key}, updated_at=now()
    `;
    return getRole(sql, userId);
  }

  // Email-managed roles are authoritative. If an email stops matching, remove that special assignment.
  if (current.assignment_source === "email" && ["angel_girl", "founder", "supreme_archmage", "hardware_scientist"].includes(current.role)) {
    await sql`update user_roles set role='user', founder_number=null, assignment_source='manual', assignment_key=null, updated_at=now() where user_id=${userId}`;
  }
  return getRole(sql, userId);
}

export async function getRole(sql: Sql, userId: string) {
  const rows = await sql<{ role: NyxoshiRole; founder_number: number | null; muted_until: string | null; shadow_banned: boolean; banned_until: string | null; permanent_ban: boolean; punishment_reason: string | null; punished_at: string | null; punished_by: string | null; revoked_role: string | null; revoked_founder_number: number | null; assignment_source: "manual" | "email" | "id"; assignment_key: string | null }>`
    select role, founder_number, muted_until::text as muted_until, shadow_banned, banned_until::text as banned_until,
      coalesce(permanent_ban,false) as permanent_ban, punishment_reason, punished_at::text as punished_at, punished_by,
      revoked_role, revoked_founder_number, assignment_source, assignment_key
    from user_roles where user_id = ${userId} limit 1
  `;
  return rows[0] ?? { role: "user" as const, founder_number: null, muted_until: null, shadow_banned: false, banned_until: null, permanent_ban: false, punishment_reason: null, punished_at: null, punished_by: null, revoked_role: null, revoked_founder_number: null, assignment_source: "manual" as const, assignment_key: null };
}

export async function requireRole(userId: string, minimum: NyxoshiRole) {
  const sql = await getSql();
  const current = await syncRoleForUser(sql, userId);
  const currentIndex = ROLE_ORDER.indexOf(current.role);
  const minimumIndex = ROLE_ORDER.indexOf(minimum);
  if (current.permanent_ban) throw new Error("Esta conta está banida permanentemente.");
  if (currentIndex < minimumIndex) throw new Error("Você não tem permissão para esta ação.");
  if (current.banned_until && new Date(current.banned_until).getTime() > Date.now()) throw new Error("Esta conta está temporariamente suspensa.");
  return { sql, role: current };
}

export async function requireFounder(userId: string) {
  const result = await requireRole(userId, "supreme_archmage");
  if (!["founder", "sub_founder", "supreme_archmage", "angel_girl"].includes(result.role.role)) throw new Error("Apenas a equipe de liderança pode acessar esta área.");
  return result;
}

export async function requireModerationAdmin(userId: string) {
  const sql = await getSql();
  const role = await syncRoleForUser(sql, userId);
  if (role.permanent_ban) throw new Error("Esta conta está banida permanentemente.");
  if (!["founder", "angel_girl"].includes(role.role)) throw new Error("Apenas Fundadores e a Angel Girl podem acessar o painel de moderação.");
  return { sql, role };
}

export async function requireAngelGirl(userId: string) {
  const sql = await getSql();
  const role = await syncRoleForUser(sql, userId);
  if (role.role !== "angel_girl") throw new Error("Apenas a Angel Girl pode acessar esta área administrativa protegida.");
  return {sql,role};
}

export async function requireHardwareScientist(userId: string) {
  const sql = await getSql();
  const role = await syncRoleForUser(sql, userId);
  if (role.role !== "hardware_scientist") throw new Error("Apenas a Maluca Cientista de Hardware com Farofa pode acessar o laboratório.");
  return {sql,role};
}

export async function requireReportModerator(userId: string) {
  const sql = await getSql();
  const role = await syncRoleForUser(sql, userId);
  if (["founder", "angel_girl"].includes(role.role)) return { sql, role };
  const allowed = await sql`select 1 from report_moderators where user_id=${userId} limit 1`;
  if (!allowed.length) throw new Error("Você não tem permissão para acessar as denúncias.");
  if (role.banned_until && new Date(role.banned_until).getTime() > Date.now()) throw new Error("Esta conta está temporariamente suspensa.");
  return { sql, role };
}
