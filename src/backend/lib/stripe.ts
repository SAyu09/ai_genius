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

/** Get base Stripe checkout UI mode parameters */
export function getCheckoutParams(mode: 'embedded' | 'hosted', baseUrl: string) {
  if (mode === 'embedded') {
    return {
      ui_mode: 'embedded' as const,
      return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    };
  }
  return {
    ui_mode: 'hosted' as const,
    success_url: `${baseUrl}/marketplace/my-agents?checkout=success`,
    cancel_url: `${baseUrl}/marketplace?checkout=cancelled`,
  };
}

/** Get localized payment methods based on currency */
export function getLocalizedPaymentMethods(currency: string = 'usd') {
  if (currency.toLowerCase() === 'inr') {
    return ['card', 'upi'];
  }
  return ['card'];
}
