import { afterEach, describe, expect, it, vi } from 'vitest';
import { repairHashBasedRoute } from '../hashRouteRedirect';

describe('repairHashBasedRoute', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('rewrites PhonePe hash callback to path-based route with query params', () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/',
        hash: '#/payment/status?transactionId=SESS_1780298145456_ABC123',
        replace,
      },
    });

    expect(repairHashBasedRoute()).toBe(true);
    expect(replace).toHaveBeenCalledWith(
      '/payment/status?transactionId=SESS_1780298145456_ABC123',
    );
  });

  it('rewrites universal payment-success hash callbacks', () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/',
        hash: '#/universal/payment-success?type=patient&planId=patient-1month&transactionId=SUB_1',
        replace,
      },
    });

    expect(repairHashBasedRoute()).toBe(true);
    expect(replace).toHaveBeenCalledWith(
      '/universal/payment-success?type=patient&planId=patient-1month&transactionId=SUB_1',
    );
  });

  it('does not rewrite unrelated hash fragments', () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/about',
        hash: '#/team',
        replace,
      },
    });

    expect(repairHashBasedRoute()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
