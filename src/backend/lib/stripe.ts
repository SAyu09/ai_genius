import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

/** Platform fee percentage (15%) */
export const PLATFORM_FEE_PERCENT = 15;

/** Calculate fee split */
export function calculateSplit(priceInCents: number) {
  const platformFee = Math.round(priceInCents * (PLATFORM_FEE_PERCENT / 100));
  const sellerPayout = priceInCents - platformFee;
  return { platformFee, sellerPayout };
}
