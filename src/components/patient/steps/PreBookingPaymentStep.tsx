import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { patientApi } from '../../../api/patient';
import { useAuth } from '../../../context/AuthContext';
import { setMarketplaceBookingPending } from '../../../lib/marketplaceBookingPending';
import type { MarketplaceBookingOptions } from '../CalendarSelection';

interface PreBookingPaymentStepProps {
  selectedProviders: Array<{
    id: string;
    name: string;
    type: string;
    fee: number;
    score?: number;
    tier?: 'HOT' | 'WARM' | 'COLD';
    breakdown?: {
      expertise: number;
      communication: number;
      quality: number;
    };
  }>;
  selectedDateTime: {
    date: Date;
    time: string;
  };
  presetEntryType?: string;
  sourceFunnel?: string;
  timezoneRegion?: string;
  matchPreferences?: {
    concerns: string[];
    language: string;
    mode: string;
    context: 'Standard' | 'Corporate' | 'Night' | 'Buddy' | 'Crisis';
    buddy?: boolean;
    night?: boolean;
    crisis?: boolean;
  };
  providerType?: string;
  bookingOptions: MarketplaceBookingOptions;
  onSuccess: (appointmentRequestId: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

const getTimeRange = (hour: number): string => {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

export default function PreBookingPaymentStep({
  selectedProviders,
  selectedDateTime,
  presetEntryType,
  timezoneRegion,
  matchPreferences,
  providerType,
  bookingOptions,
  onSuccess,
  onBack,
  onCancel,
}: PreBookingPaymentStepProps) {
  const { user } = useAuth();
  const isNriUser = Boolean((user as any)?.nriTermsAccepted || (user as any)?.nriDeclared);

  const isVideoAppointment = String(bookingOptions.appointmentType || '').toLowerCase() === 'video';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState<number>(Math.max(...selectedProviders.map((p) => p.fee), 29900));

  useEffect(() => {
    const providerKey = providerType ? providerType.toLowerCase() : 'all';

    const DOMESTIC_MAP: Record<string, string> = {
      'psychologist': 'clinical-psychologist',
      'therapist': 'clinical-psychologist',
      'psychiatrist': 'psychiatrist',
      'coach': 'nlp-coach',
      'all': 'clinical-psychologist'
    };

    const NRI_MAP: Record<string, string> = {
      'psychologist': 'nri-psychologist',
      'therapist': 'nri-therapist',
      'psychiatrist': 'nri-psychiatrist',
      'coach': 'nri-coach',
      'all': 'nri-therapist'
    };

    const pricingType = isNriUser ? (NRI_MAP[providerKey] || 'nri-therapist') : (DOMESTIC_MAP[providerKey] || 'clinical-psychologist');

    patientApi.getPricing({ mode: isNriUser ? 'nri' : undefined }).then((res: any) => {
      const data = res?.data ?? res;
      const rows: any[] = data?.sessions ?? data?.sessionPricing ?? [];
      let match: any = null;
      if (pricingType) {
        match = rows.find((r: any) => String(r.providerType).toLowerCase() === pricingType)
          ?? rows.find((r: any) => String(r.providerType).toLowerCase().includes(pricingType.replace('nri-', '')));
      } else if (isNriUser) {
        match = rows.find((r: any) => String(r.providerType).toLowerCase().startsWith('nri-')) ?? rows[0];
      } else {
        match = rows[0];
      }
      if (match && Number(match.price) > 0) {
        const baseMinor = Number(match.price) * 100;
        // Apply 10% video surcharge when appointment is video
        const videoSurcharge = Number(data?.videoSurchargePercent ?? 10);
        setFee(isVideoAppointment ? Math.round(baseMinor * (1 + videoSurcharge / 100)) : baseMinor);
      }
    }).catch(() => { });
  }, [providerType, isNriUser, isVideoAppointment]);

  const feeInRupees = fee / 100;

  const handlePhonePePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const [hourRaw, minuteRaw] = selectedDateTime.time.split(':');
      const startHour = Number(hourRaw);
      const startMinute = Number(minuteRaw || 0);

      const scheduledDate = new Date(selectedDateTime.date);
      scheduledDate.setHours(startHour, startMinute, 0, 0);
      const scheduledAt = scheduledDate.toISOString();

      const preferredDay = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
      const timeRange = getTimeRange(startHour);

      const response: any = await patientApi.bookMarketplaceSession({
        concerns: bookingOptions.concerns,
        availabilityPrefs: {
          timeRanges: [timeRange],
          preferredDays: [preferredDay],
        },
        scheduledAt,
        appointmentType: bookingOptions.appointmentType,
        providerType: presetEntryType,
        patientTimezone: bookingOptions.patientTimezone || timezoneRegion,
      });

      const payload = response?.data ?? response;
      const amountMinor = Number(payload?.amountMinor);
      if (Number.isFinite(amountMinor) && amountMinor > 0) {
        setFee(amountMinor);
      }

      const transactionId = String(payload?.transactionId || '').trim();
      const redirectUrl = String(payload?.redirectUrl || '').trim();

      if (redirectUrl && transactionId) {
        const pendingKey = `manas360.smartmatch.pending.${transactionId}`;
        const pendingPayload = {
          smartMatchSummary: {
            selectedDate: selectedDateTime.date.toISOString(),
            selectedTime: selectedDateTime.time,
            preferences: {
              ...matchPreferences,
              concerns: bookingOptions.concerns,
              mode: bookingOptions.appointmentType,
            },
          },
          assessmentResults: [],
        };
        localStorage.setItem(pendingKey, JSON.stringify(pendingPayload));
        setMarketplaceBookingPending({
          savedAt: new Date().toISOString(),
          transactionId,
          smartMatchSummary: pendingPayload.smartMatchSummary,
        });

        window.location.href = redirectUrl;
        return;
      }

      const requestId = payload?.paymentId || payload?.appointmentRequestId;

      if (!requestId) {
        setError('Unable to create booking request. Please try again.');
        return;
      }

      onSuccess(String(requestId));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
            2
          </div>
          <h3 className="text-lg font-semibold text-charcoal">Confirm & Pay</h3>
        </div>
        <p className="text-sm text-charcoal/60 ml-10">Complete payment to initiate your marketplace session booking</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-calm-sage/20 bg-white/50 p-4 space-y-3">
        <div>
          <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
            Date & Time
          </p>
          <p className="text-sm font-semibold text-charcoal mt-1">
            {selectedDateTime.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {' '}at {selectedDateTime.time}
          </p>
        </div>

        {bookingOptions.concerns.length > 0 && (
          <div>
            <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
              Concerns
            </p>
            <p className="text-sm font-semibold text-charcoal mt-1">
              {bookingOptions.concerns.join(', ')}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
            Session Type
          </p>
          <p className="text-sm font-semibold text-charcoal mt-1 capitalize">
            {!providerType || providerType === 'ALL'
              ? 'Single Session'
              : `${providerType.toLowerCase()} Session`}
          </p>
        </div>

        <div>
          <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
            Appointment Type
          </p>
          <p className="text-sm font-semibold text-charcoal mt-1 capitalize">
            {bookingOptions.appointmentType}
          </p>
        </div>

        <div className="border-t border-calm-sage/15 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-charcoal">Session Fee</p>
            <p className="text-lg font-bold text-teal-600">₹{feeInRupees.toFixed(0)}</p>
          </div>
          <p className="text-xs text-charcoal/60 mt-2">
            After payment, your request goes to the marketplace. A provider will be matched and your session confirmed.
          </p>
          {isNriUser ? (
            <p className="text-xs text-blue-700 mt-2">
              NRI Rate: fixed per-session price is applied for this consultation flow.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 flex gap-3">
        <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold">Secure Payment</p>
          <p className="text-xs mt-1">Your payment is processed securely by PhonePe.</p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handlePhonePePayment}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-calm px-4 py-3 font-semibold text-white transition-all hover:bg-none hover:bg-[var(--brand-navy-hover)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Processing...' : `Pay ₹${feeInRupees.toFixed(0)}`}
        </button>
        <button
          onClick={onBack}
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back to Schedule
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
