export const LESSON_COST = 10;

export const PLANS = [
  { id: "basic", name: "Basic", price: 150, tokens: 500, tagline: "50 lesson previews this month" },
  { id: "standard", name: "Standard", price: 300, tokens: 1100, tagline: "110 lesson previews this month", popular: true },
  { id: "pro", name: "Pro", price: 450, tokens: 1700, tagline: "170 lesson previews this month" },
  { id: "addon", name: "Add-on", price: 50, tokens: 150, tagline: "15 more lesson previews" },
];

export const planName = (id) => PLANS.find((plan) => plan.id === id)?.name ?? "No plan";
