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
