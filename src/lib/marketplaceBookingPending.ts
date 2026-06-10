const MARKETPLACE_BOOKING_PENDING_KEY = 'manas360.marketplace.booking.pending';

export type MarketplaceBookingPending = {
  savedAt: string;
  transactionId?: string;
  smartMatchSummary?: {
    selectedDate?: string;
    selectedTime?: string;
    preferences?: {
      concerns?: string[];
      language?: string;
      mode?: string;
      context?: string;
    };
  };
};

export const getMarketplaceBookingPending = (): MarketplaceBookingPending | null => {
  try {
    const raw = sessionStorage.getItem(MARKETPLACE_BOOKING_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketplaceBookingPending;
    return parsed?.savedAt ? parsed : null;
  } catch {
    return null;
  }
};

export const setMarketplaceBookingPending = (payload: MarketplaceBookingPending): void => {
  sessionStorage.setItem(MARKETPLACE_BOOKING_PENDING_KEY, JSON.stringify(payload));
};

export const clearMarketplaceBookingPending = (): void => {
  sessionStorage.removeItem(MARKETPLACE_BOOKING_PENDING_KEY);
};
