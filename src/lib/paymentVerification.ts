import { http } from './http';

export const PAYMENT_POLL_MAX_ATTEMPTS = 5;
export const PAYMENT_POLL_INTERVAL_MS = 3000;

export const PAYMENT_SUCCESS_STATES = new Set([
  'COMPLETED',
  'PAYMENT_SUCCESS',
  'SUCCESS',
  'PAID',
  'ACTIVE',
  'TRIAL',
  'TRIALING',
]);

export const PAYMENT_FAILURE_STATES = new Set([
  'FAILED',
  'DECLINED',
  'PAYMENT_ERROR',
  'PAYMENT_DECLINED',
  'PAYMENT_FAILED',
]);

export const PAYMENT_PENDING_STATES = new Set(['PENDING', 'PENDING_PAYMENT', 'PROCESSING']);

export type PaymentPollOutcome = 'success' | 'failed' | 'timeout';

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export const readPaymentStateFromPayload = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;
  const nested = record.data;
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    const payment = nestedRecord.payment;
    if (payment && typeof payment === 'object') {
      const paymentRecord = payment as Record<string, unknown>;
      return String(paymentRecord.status || paymentRecord.state || '').toUpperCase();
    }
    return String(nestedRecord.state || nestedRecord.code || nestedRecord.status || '').toUpperCase();
  }
  const payment = record.payment;
  if (payment && typeof payment === 'object') {
    const paymentRecord = payment as Record<string, unknown>;
    return String(paymentRecord.status || paymentRecord.state || '').toUpperCase();
  }
  return String(record.state || record.code || record.status || '').toUpperCase();
};

export const isPaymentSuccessState = (state: string): boolean => PAYMENT_SUCCESS_STATES.has(state);

export const isPaymentFailureState = (state: string): boolean => PAYMENT_FAILURE_STATES.has(state);

export const fetchStandardPaymentState = async (transactionId: string): Promise<string> => {
  const [phonepeResult, statusResult] = await Promise.allSettled([
    http.get(`/v1/payments/phonepe/status/${transactionId}`),
    http.get(`/v1/payments/status/${transactionId}`),
  ]);

  const states: string[] = [];
  if (phonepeResult.status === 'fulfilled') {
    states.push(readPaymentStateFromPayload(phonepeResult.value.data));
  }
  if (statusResult.status === 'fulfilled') {
    states.push(readPaymentStateFromPayload(statusResult.value.data));
    const details = statusResult.value.data?.data;
    if (details && typeof details === 'object') {
      const status = String((details as Record<string, unknown>).status || '').toUpperCase();
      if (status) states.push(status);
    }
  }

  if (states.some((state) => isPaymentSuccessState(state))) return 'COMPLETED';
  if (states.some((state) => isPaymentFailureState(state))) return states.find((state) => isPaymentFailureState(state)) || 'FAILED';
  return states.find(Boolean) || 'PENDING';
};

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Backend accepts either `orderId` (payment record UUID) or `transactionId` (PhonePe / gateway id). */
export const buildUniversalVerifyParams = (
  identifier: string,
  extras?: { type?: string; planId?: string | null; orderId?: string | null; transactionId?: string | null },
): Record<string, string> => {
  let resolvedOrderId = String(extras?.orderId || '').trim();
  let resolvedTransactionId = String(extras?.transactionId || '').trim();

  if (!resolvedOrderId && UUID_LIKE.test(identifier)) {
    resolvedOrderId = identifier;
  }
  if (!resolvedTransactionId && identifier && !UUID_LIKE.test(identifier)) {
    resolvedTransactionId = identifier;
  }
  if (!resolvedOrderId && !resolvedTransactionId && identifier) {
    if (UUID_LIKE.test(identifier)) {
      resolvedOrderId = identifier;
    } else {
      resolvedTransactionId = identifier;
    }
  }

  const params: Record<string, string> = {};
  if (resolvedOrderId) params.orderId = resolvedOrderId;
  if (resolvedTransactionId) params.transactionId = resolvedTransactionId;
  if (extras?.type) params.type = extras.type;
  if (extras?.planId) params.planId = extras.planId;
  return params;
};

export const fetchUniversalPaymentState = async (
  identifier: string,
  params?: { type?: string; planId?: string | null; orderId?: string | null; transactionId?: string | null },
): Promise<string> => {
  const response = await http.get('/v1/payments/universal/verify', {
    params: buildUniversalVerifyParams(identifier, params),
  });
  return readPaymentStateFromPayload(response.data);
};

export async function pollPaymentUntilSettled(options: {
  mode: 'standard' | 'universal';
  transactionId: string;
  universalParams?: { type?: string; planId?: string | null; orderId?: string | null; transactionId?: string | null };
  maxAttempts?: number;
  intervalMs?: number;
  onProgress?: (attempt: number, maxAttempts: number, state: string) => void;
  signal?: AbortSignal;
}): Promise<PaymentPollOutcome> {
  const maxAttempts = options.maxAttempts ?? PAYMENT_POLL_MAX_ATTEMPTS;
  const intervalMs = options.intervalMs ?? PAYMENT_POLL_INTERVAL_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    let state = 'PENDING';
    try {
      state =
        options.mode === 'universal'
          ? await fetchUniversalPaymentState(options.transactionId, options.universalParams)
          : await fetchStandardPaymentState(options.transactionId);
    } catch {
      state = 'PENDING';
    }

    options.onProgress?.(attempt, maxAttempts, state);

    if (isPaymentSuccessState(state)) return 'success';
    if (isPaymentFailureState(state)) return 'failed';

    if (attempt < maxAttempts) {
      await sleep(intervalMs, options.signal);
    }
  }

  return 'timeout';
}
