/**
 * PhonePe / backend callbacks sometimes return hash URLs (`/#/payment/status`, `/#/universal/payment-success`).
 * This app uses createBrowserRouter (path-based), so those land on `/` (Hero) unless repaired.
 */
const IGNORE_HASH_SNIPPETS = ['googtrans'];

const PAYMENT_CALLBACK_PATHS = ['/payment/status', '/universal/payment-success'];

export function repairHashBasedRoute(): boolean {
  if (typeof window === 'undefined') return false;

  const { hash, pathname } = window.location;
  if (!hash.startsWith('#/')) return false;
  if (IGNORE_HASH_SNIPPETS.some((snippet) => hash.includes(snippet))) return false;

  const target = hash.slice(1);
  const targetPath = target.split('?')[0]?.split('#')[0] || '';
  if (!targetPath.startsWith('/')) return false;

  const isPaymentCallback = PAYMENT_CALLBACK_PATHS.some((route) => targetPath === route || targetPath.startsWith(`${route}/`));
  const onMarketingRoot = pathname === '/' || pathname === '';

  // Repair hash callbacks on the marketing root, or any payment callback hash regardless of pathname.
  if (!onMarketingRoot && !isPaymentCallback) return false;

  if (!onMarketingRoot && pathname === targetPath.split('?')[0]) {
    return false;
  }

  window.location.replace(target);
  return true;
}
