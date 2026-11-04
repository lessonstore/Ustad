export type PlanId = "basic" | "standard" | "pro" | "addon";

export const PLANS: { id: PlanId; name: string; price: number; tokens: number; tagline: string; popular?: boolean }[] = [
  { id: "basic", name: "Basic", price: 150, tokens: 500, tagline: "50 lesson downloads this month" },
  { id: "standard", name: "Standard", price: 300, tokens: 1100, tagline: "110 lesson downloads this month", popular: true },
  { id: "pro", name: "Pro", price: 450, tokens: 1700, tagline: "170 lesson downloads this month" },
  { id: "addon", name: "Add-on", price: 50, tokens: 150, tagline: "Top up 15 more downloads" },
];

export const LESSON_COST = 10;
export const EASYPAISA = { title: "Waqar Ishaq", account: "03469140009" };
export const planName = (id: string | null | undefined) => PLANS.find((p) => p.id === id)?.name ?? "No plan";
