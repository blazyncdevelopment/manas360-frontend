/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentStatusPage from '../PaymentStatus';

const pollPaymentUntilSettled = vi.fn();
const checkAuth = vi.fn();
const meApi = vi.fn();
const repairHashBasedRoute = vi.fn();

vi.mock('../../../lib/paymentVerification', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/paymentVerification')>(
    '../../../lib/paymentVerification',
  );
  return {
    ...actual,
    pollPaymentUntilSettled: (...args: unknown[]) => pollPaymentUntilSettled(...args),
  };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ checkAuth }),
  getPostLoginRoute: () => '/patient/dashboard',
}));

vi.mock('../../../api/auth', () => ({
  me: (...args: unknown[]) => meApi(...args),
}));

vi.mock('../../../lib/hashRouteRedirect', () => ({
  repairHashBasedRoute: () => repairHashBasedRoute(),
}));

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

function renderPaymentStatus(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/payment/status" element={<PaymentStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PaymentStatusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pollPaymentUntilSettled.mockResolvedValue('success');
    checkAuth.mockResolvedValue(undefined);
    meApi.mockResolvedValue({
      id: 'user-1',
      role: 'patient',
      requiresSubscription: false,
      patientSubscriptionActive: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows error when transaction id is missing', async () => {
    renderPaymentStatus('/payment/status');

    expect(
      await screen.findByText('Invalid payment session. Missing transaction identifier.'),
    ).toBeTruthy();
  });

  it('polls standard status, refreshes auth, and redirects to dashboard', async () => {
    vi.useFakeTimers();

    renderPaymentStatus('/payment/status?transactionId=SESS_1780298145456_ABC123');

    await waitFor(() => {
      expect(pollPaymentUntilSettled).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'standard',
          transactionId: 'SESS_1780298145456_ABC123',
        }),
      );
    });

    await waitFor(() => {
      expect(meApi).toHaveBeenCalled();
      expect(checkAuth).toHaveBeenCalledWith({ force: true });
    });

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeTruthy();
    });

    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/patient/dashboard', { replace: true });
    });
  });

  it('uses universal verify when checkout type and plan are in the query string', async () => {
    renderPaymentStatus(
      '/payment/status?transactionId=SUB_patient_1&orderId=&type=patient&planId=patient-1month',
    );

    await waitFor(() => {
      expect(pollPaymentUntilSettled).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'universal',
          universalParams: expect.objectContaining({
            type: 'patient',
            planId: 'patient-1month',
            transactionId: 'SUB_patient_1',
          }),
        }),
      );
    });
  });

  it('uses universal verify for subscription ids even without plan query params', async () => {
    localStorage.setItem(
      'manas360.patient.subscription.cart.v1',
      JSON.stringify({
        planId: 'monthly',
        addons: { premiumLibraryPack: 'none' },
        updatedAt: new Date().toISOString(),
      }),
    );

    renderPaymentStatus('/payment/status?transactionId=SUB_patient_1780298145456');

    await waitFor(() => {
      expect(pollPaymentUntilSettled).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'universal',
          universalParams: expect.objectContaining({
            type: 'patient',
            planId: 'patient-1month',
            transactionId: 'SUB_patient_1780298145456',
          }),
        }),
      );
    });

    localStorage.removeItem('manas360.patient.subscription.cart.v1');
  });

  it('repairs hash-based PhonePe callbacks on mount', async () => {
    renderPaymentStatus('/payment/status?transactionId=SESS_1');

    await waitFor(() => {
      expect(repairHashBasedRoute).toHaveBeenCalled();
    });
  });
});
