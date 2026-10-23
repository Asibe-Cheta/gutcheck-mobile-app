import { Platform } from 'react-native';

/**
 * Parse introductory (free trial) duration from RevenueCat / StoreKit intro price.
 * Trial copy in the UI must match what the App Store payment sheet shows.
 */

export type IntroPriceLike = {
  price?: number;
  periodUnit?: string;
  periodNumberOfUnits?: number;
} | null | undefined;

export function parseFreeTrialDays(introPrice: IntroPriceLike): number | null {
  if (!introPrice || introPrice.price !== 0) return null;

  const unit = String(introPrice.periodUnit || '').toUpperCase();
  const count = introPrice.periodNumberOfUnits ?? 0;
  if (!count || count <= 0) return null;

  switch (unit) {
    case 'DAY':
      return count;
    case 'WEEK':
      return count * 7;
    case 'MONTH':
      return count * 30;
    case 'YEAR':
      return count * 365;
    default:
      return null;
  }
}

export function hasFreeTrialIntro(introPrice: IntroPriceLike): boolean {
  return parseFreeTrialDays(introPrice) !== null;
}

/** Remove trial-length claims from App Store product descriptions (we show trial separately). */
export function sanitizeSubscriptionDescription(description?: string, fallback?: string): string {
  const base = (description || '').trim();
  const stripped = base
    .replace(/\d+\s*-?\s*day(s)?\s+free(\s+trial)?/gi, '')
    .replace(/\d+\s*-?\s*week(s)?\s+free(\s+trial)?/gi, '')
    .replace(/\bfree\s+trial\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (stripped.length > 8) return stripped;
  return fallback || 'Full access to all premium features';
}

export function trialCtaLabel(days: number | null | undefined): string {
  if (days && days > 0) {
    return `START YOUR ${days}-DAY FREE TRIAL`;
  }
  return 'START FREE TRIAL';
}

export function trialBadgeLabel(days: number | null | undefined): string | null {
  if (!days || days <= 0) return null;
  return `${days}-day free trial`;
}

export function trialBillingDisclaimer(days: number | null | undefined): string {
  if (days && days > 0) {
    return `Billing starts unless cancelled before the trial ends. No payment is due now; billing starts after the ${days}-day free trial ends. Renews automatically.`;
  }
  return 'Billing starts unless cancelled. Renews automatically.';
}

/* ------------------------------------------------------------------------------------------
 * Paywall copy (PRD 9.2 and 9.3). Every price, period and trial length comes from the store,
 * so a price or trial change in App Store Connect / Play Console needs no code change.
 * ---------------------------------------------------------------------------------------- */

export type PlanInterval = 'month' | 'year';

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(price);
  } catch {
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${price.toFixed(2)}`;
  }
}

/** 7 → "1 week", 14 → "2 weeks", 3 → "3 days". */
export function trialLengthLabel(days: number): string {
  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  return days === 1 ? '1 day' : `${days} days`;
}

export function formatLongDate(date: Date): string {
  try {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return date.toDateString();
  }
}

export function trialEndDate(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

const perPeriod = (interval: PlanInterval) => (interval === 'year' ? 'a year' : 'a month');
const everyPeriod = (interval: PlanInterval) => (interval === 'year' ? 'every year' : 'every month');
const eachPeriod = (interval: PlanInterval) => (interval === 'year' ? 'each year' : 'each month');

export interface PaywallPlanInput {
  price: number;
  currency: string;
  interval: PlanInterval;
  /** Only set when the store says this user can have the trial. */
  trialDays: number | null;
}

/** "£59.99 a year" */
export function planPriceLine(plan: PaywallPlanInput): string {
  return `${formatPrice(plan.price, plan.currency)} ${perPeriod(plan.interval)}`;
}

/** Yearly: "£5.00 a month, billed yearly"; monthly: "Billed monthly". */
export function planSubLine(plan: PaywallPlanInput): string {
  if (plan.interval === 'year') {
    return `${formatPrice(Math.round((plan.price / 12) * 100) / 100, plan.currency)} a month, billed yearly`;
  }
  return 'Billed monthly';
}

/** "1 week free, then £59.99 a year" or "No free trial". */
export function planOfferLine(plan: PaywallPlanInput): string {
  if (plan.trialDays) return `${trialLengthLabel(plan.trialDays)} free, then ${planPriceLine(plan)}`;
  return 'No free trial';
}

/** Whole-percent saving of the yearly plan against twelve monthly payments, or null. */
export function yearlySavingPercent(yearlyPrice: number, monthlyPrice: number): number | null {
  if (!yearlyPrice || !monthlyPrice) return null;
  const percent = Math.floor((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  return percent > 0 ? percent : null;
}

export interface PaywallCopy {
  cta: string;
  summary: string;
  disclosure: string;
}

/** CTA, summary and renewal disclosure for the selected plan (PRD 9.3). */
export function paywallCopy(plan: PaywallPlanInput, now: Date = new Date()): PaywallCopy {
  const price = planPriceLine(plan);
  if (plan.trialDays) {
    const endDate = formatLongDate(trialEndDate(plan.trialDays, now));
    return {
      cta: `Start ${trialLengthLabel(plan.trialDays).replace(' ', '-')} free trial`,
      summary: `Free until ${endDate}. Then ${price}.`,
      disclosure:
        `You won't be charged if you cancel at least 24 hours before ${endDate}. After the trial, your ` +
        `subscription renews automatically ${eachPeriod(plan.interval)} until you cancel in your ` +
        `${storeAccountName()} settings.`,
    };
  }
  return {
    cta: `Subscribe for ${price}`,
    summary: `Billed today, then ${everyPeriod(plan.interval)}.${plan.interval === 'month' ? ' No free trial.' : ''}`,
    disclosure: `Renews automatically ${eachPeriod(plan.interval)} unless cancelled at least 24 hours before the renewal date.`,
  };
}

function storeAccountName(): string {
  return Platform.OS === 'android' ? 'Google Play' : 'Apple Account';
}
