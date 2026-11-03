export const PLAN_PRICES = {
  iniciante: "price_1UXNr42eVubo4B6iL3QgC18m",
  criador: "price_1UXNu52eVubo4B6ix8Arw6tV",
  agencia: "price_1UXNvh2eVubo4B6ieGcoxKln",
} as const;
export type PlanKey = keyof typeof PLAN_PRICES;

export const PLAN_CHECKOUTS: Record<PlanKey, string> = {
  iniciante: "https://pay.kiwify.com.br/HlmiFNa",
  criador: "https://pay.kiwify.com.br/ZbmNajz",
  agencia: "https://pay.kiwify.com.br/MNdSLcO",
};

export const PLANS: { key: PlanKey; n: string; p: string; f: string[]; hot?: boolean; checkout: string }[] = [
  { key: "iniciante", n: "Iniciante", p: "47", checkout: PLAN_CHECKOUTS.iniciante, f: ["30 vídeos/mês", "Legendas virais", "Exportação 720p"] },
  { key: "criador", n: "Criador", p: "97", checkout: PLAN_CHECKOUTS.criador, f: ["150 vídeos/mês", "Tudo do Iniciante", "Exportação 1080p", "Trilhas premium"], hot: true },
  { key: "agencia", n: "Agência", p: "247", checkout: PLAN_CHECKOUTS.agencia, f: ["Vídeos ilimitados", "Multi-canais", "Prioridade no render", "Suporte VIP"] },
];
