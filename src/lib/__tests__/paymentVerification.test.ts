import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildUniversalVerifyParams,
  pollPaymentUntilSettled,
  readPaymentStateFromPayload,
} from '../paymentVerification';

vi.mock('../http', () => ({
  http: {
    get: vi.fn(),
  },
}));

import { http } from '../http';

describe('paymentVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readPaymentStateFromPayload', () => {
    it('reads standard payment state', () => {
      expect(
        readPaymentStateFromPayload({
          success: true,
          data: { state: 'COMPLETED', transactionId: 'SESS_1' },
        }),
      ).toBe('COMPLETED');
    });

    it('reads universal payment status', () => {
      expect(
        readPaymentStateFromPayload({
          success: true,
          data: { payment: { status: 'PENDING_PAYMENT' } },
        }),
      ).toBe('PENDING_PAYMENT');
    });
  });

  describe('buildUniversalVerifyParams', () => {
    it('uses orderId for UUID payment records', () => {
      const id = '3782821a-8168-4da6-8809-e7f1123983e8';
      expect(buildUniversalVerifyParams(id, { type: 'patient', planId: 'patient-1month' })).toEqual({
        orderId: id,
        type: 'patient',
        planId: 'patient-1month',
      });
    });

    it('uses transactionId for gateway session ids', () => {
      expect(
        buildUniversalVerifyParams('SESS_1780298145456_ABC123', {
          type: 'patient',
          planId: 'patient-1month',
        }),
      ).toEqual({
        transactionId: 'SESS_1780298145456_ABC123',
        type: 'patient',
        planId: 'patient-1month',
      });
    });

    it('sends both ids when order and gateway ids are known', () => {
      expect(
        buildUniversalVerifyParams('SESS_123', {
          orderId: '3782821a-8168-4da6-8809-e7f1123983e8',
          transactionId: 'SESS_123',
          type: 'patient',
        }),
      ).toEqual({
        orderId: '3782821a-8168-4da6-8809-e7f1123983e8',
        transactionId: 'SESS_123',
        type: 'patient',
      });
    });
  });

  describe('pollPaymentUntilSettled', () => {
    it('stops on success after pending polls', async () => {
      let calls = 0;
      vi.mocked(http.get).mockImplementation(async () => {
        calls += 1;
        const state = calls >= 3 ? 'COMPLETED' : 'PENDING';
        return { data: { success: true, data: { state } } } as never;
      });

      const onProgress = vi.fn();
      const outcome = await pollPaymentUntilSettled({
        mode: 'standard',
        transactionId: 'SESS_123',
        maxAttempts: 5,
        intervalMs: 1,
        onProgress,
      });

      expect(outcome).toBe('success');
      expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('returns timeout when still pending after max attempts', async () => {
      vi.mocked(http.get).mockResolvedValue({
        data: { success: true, data: { state: 'PENDING' } },
      } as never);

      const outcome = await pollPaymentUntilSettled({
        mode: 'standard',
        transactionId: 'SESS_123',
        maxAttempts: 3,
        intervalMs: 1,
      });

      expect(outcome).toBe('timeout');
      expect(http.get).toHaveBeenCalled();
    });

    it('calls universal verify with transactionId for gateway ids', async () => {
      vi.mocked(http.get).mockResolvedValue({
        data: { success: true, data: { payment: { status: 'COMPLETED' } } },
      } as never);

      const outcome = await pollPaymentUntilSettled({
        mode: 'universal',
        transactionId: 'SUB_patient_1780298145456',
        universalParams: { type: 'patient', planId: 'patient-1month', transactionId: 'SUB_patient_1780298145456' },
        maxAttempts: 1,
        intervalMs: 1,
      });

      expect(outcome).toBe('success');
      expect(http.get).toHaveBeenCalledWith('/v1/payments/universal/verify', {
        params: {
          transactionId: 'SUB_patient_1780298145456',
          type: 'patient',
          planId: 'patient-1month',
        },
      });
    });
  });
});
