import type { ProviderLeadPurchaseResult } from '../api/provider';
import {
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_POLL_MAX_ATTEMPTS,
  pollPaymentUntilSettled,
} from './paymentVerification';

const PENDING_KEY = 'manas360.provider.leadPurchase.pending';
const PENDING_TXN_PREFIX = 'manas360.provider.leadPurchase.pending.';

export interface PendingLeadPurchase {
  leadId: string;
  merchantTransactionId: string;
  paymentId?: string;
  createdAt: string;
}

export const isLeadPurchaseTransaction = (transactionId: string): boolean => {
  const normalized = String(transactionId || '').trim();
  return normalized.startsWith('LEAD_PURCH_') || normalized.startsWith('LEAD_');
};

export const savePendingLeadPurchase = (
  leadId: string,
  merchantTransactionId: string,
  paymentId?: string,
): void => {
  const payload: PendingLeadPurchase = {
    leadId,
    merchantTransactionId,
    paymentId,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    localStorage.setItem(`${PENDING_TXN_PREFIX}${merchantTransactionId}`, JSON.stringify(payload));
    if (paymentId) {
      localStorage.setItem(`${PENDING_TXN_PREFIX}${paymentId}`, JSON.stringify(payload));
    }
  } catch {
    // ignore storage failures — redirect still proceeds
  }
};

export const getPendingLeadPurchase = (merchantTransactionId?: string | null): PendingLeadPurchase | null => {
  try {
    if (merchantTransactionId) {
      const byTxn = localStorage.getItem(`${PENDING_TXN_PREFIX}${merchantTransactionId}`);
      if (byTxn) return JSON.parse(byTxn) as PendingLeadPurchase;
    }
    const latest = localStorage.getItem(PENDING_KEY);
    if (latest) return JSON.parse(latest) as PendingLeadPurchase;
  } catch {
    return null;
  }
  return null;
};

export const clearPendingLeadPurchase = (merchantTransactionId: string): void => {
  try {
    const pending = getPendingLeadPurchase(merchantTransactionId);
    localStorage.removeItem(PENDING_KEY);
    localStorage.removeItem(`${PENDING_TXN_PREFIX}${merchantTransactionId}`);
    if (pending?.paymentId) {
      localStorage.removeItem(`${PENDING_TXN_PREFIX}${pending.paymentId}`);
    }
  } catch {
    // ignore
  }
};

export async function finalizeProviderLeadPurchase(
  merchantTransactionId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (attempt: number, maxAttempts: number, state: string) => void;
  },
): Promise<ProviderLeadPurchaseResult> {
  const pending = getPendingLeadPurchase(merchantTransactionId);
  if (!pending?.leadId) {
    throw new Error('Pending lead purchase not found. Please try buying the lead again.');
  }

  const outcome = await pollPaymentUntilSettled({
    mode: 'standard',
    transactionId: merchantTransactionId,
    maxAttempts: options?.maxAttempts ?? PAYMENT_POLL_MAX_ATTEMPTS,
    intervalMs: options?.intervalMs ?? PAYMENT_POLL_INTERVAL_MS,
    onProgress: options?.onProgress,
  });

  if (outcome === 'success') {
    clearPendingLeadPurchase(merchantTransactionId);
    return {
      paymentRequired: false,
      updatedLead: {
        id: pending.leadId,
        status: 'PURCHASED',
        providerId: '',
      },
    };
  }

  if (outcome === 'failed') {
    throw new Error('Payment was declined or failed. Please try again.');
  }

  throw new Error(
    'Payment verification timed out. If money was debited, your lead will be assigned shortly.',
  );
}
