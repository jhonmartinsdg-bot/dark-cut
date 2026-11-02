export const PLAN_PRICES = {
  iniciante: "price_1UXNr42eVubo4B6iL3QgC18m",
  criador: "price_1UXNu52eVubo4B6ix8Arw6tV",
  agencia: "price_1UXNvh2eVubo4B6ieGcoxKln",
} as const;
export type PlanKey = keyof typeof PLAN_PRICES;

export const PLANS: { key: PlanKey; n: string; p: string; f: string[]; hot?: boolean }[] = [
  { key: "iniciante", n: "Iniciante", p: "47", f: ["30 vídeos/mês", "Legendas virais", "Exportação 720p"] },
  { key: "criador", n: "Criador", p: "97", f: ["150 vídeos/mês", "Tudo do Iniciante", "Exportação 1080p", "Trilhas premium"], hot: true },
  { key: "agencia", n: "Agência", p: "247", f: ["Vídeos ilimitados", "Multi-canais", "Prioridade no render", "Suporte VIP"] },
];
