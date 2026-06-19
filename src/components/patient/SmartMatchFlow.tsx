import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ProviderSelectionStep from './steps/ProviderSelectionStep';
import PreBookingPaymentStep from './steps/PreBookingPaymentStep';
import CalendarSelection, { type MarketplaceBookingOptions } from './CalendarSelection';
import { patientApi } from '../../api/patient';

interface SmartMatchFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProviderType?: 'ALL' | 'THERAPIST' | 'PSYCHOLOGIST' | 'PSYCHIATRIST' | 'COACH';
  lockProviderType?: boolean;
  presetEntryType?: string;
  sourceFunnel?: string;
  timezoneRegion?: string;
}

type FlowStep = 'calendar' | 'provider-selection' | 'pre-payment' | 'success';

type SmartMatchPreferences = {
  concerns: string[];
  language: string;
  mode: string;
  context: 'Standard' | 'Corporate' | 'Night' | 'Buddy' | 'Crisis';
  buddy?: boolean;
  night?: boolean;
  crisis?: boolean;
};

interface CalendarSelection {
  date: Date;
  time: string;
}

interface SelectedProvider {
  id: string;
  name: string;
  type: string;
  fee: number;
  score?: number;
  tier?: 'HOT' | 'WARM' | 'COLD';
  matchBand?: 'PLATINUM' | 'HOT' | 'WARM' | 'COLD';
  breakdown?: {
    expertise: number;
    communication: number;
    quality: number;
  };
}

const getNriFixedFeeMinor = (entryType?: string): number | null => {
  if (entryType === 'nri_psychologist') return 2999 * 100;
  if (entryType === 'nri_psychiatrist') return 3499 * 100;
  if (entryType === 'nri_therapist') return 3599 * 100;
  return null;
};

export default function SmartMatchFlow({
  isOpen,
  onClose,
  onSuccess,
  initialProviderType = 'ALL',
  lockProviderType: _lockProviderType = false,
  presetEntryType,
  sourceFunnel,
  timezoneRegion,
}: SmartMatchFlowProps) {
  const nriFixedFeeMinor = getNriFixedFeeMinor(presetEntryType);
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>('calendar');
  const [calendarSelection, setCalendarSelection] = useState<CalendarSelection | null>(null);
  const [selectedProviderType, setSelectedProviderType] = useState<
    'ALL' | 'THERAPIST' | 'PSYCHOLOGIST' | 'PSYCHIATRIST' | 'COACH'
  >(initialProviderType);
  const [selectedProviders, setSelectedProviders] = useState<SelectedProvider[]>([]);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [isFreeBlocked, setIsFreeBlocked] = useState(false);
  const [inGrace, setInGrace] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');
  const [graceEndDate, setGraceEndDate] = useState<string | null>(null);
  const [matchPreferences, setMatchPreferences] = useState<SmartMatchPreferences>({
    concerns: [],
    language: '',
    mode: '',
    context: 'Standard',
  });
  const [bookingOptions, setBookingOptions] = useState<MarketplaceBookingOptions | null>(null);

  const flowSteps: FlowStep[] = ['calendar', 'provider-selection', 'pre-payment', 'success'];

  const getAvailabilityPrefs = () => {
    if (!calendarSelection) {
      return null;
    }

    const [hourRaw, minuteRaw] = calendarSelection.time.split(':');
    const startHour = Number(hourRaw);
    const startMinute = Number(minuteRaw || 0);
    const startMinuteOfDay = startHour * 60 + startMinute;
    const endMinuteOfDay = startMinuteOfDay + 30;

    return {
      daysOfWeek: [calendarSelection.date.getDay()],
      timeSlots: [{ startMinute: startMinuteOfDay, endMinute: endMinuteOfDay }],
    };
  };

  useEffect(() => {
    if (!isOpen) return;

    const checkSubscription = async () => {
      try {
        setIsCheckingSubscription(true);
        const response = await patientApi.getSubscription();
        const subscription = (response as any)?.data ?? response;
        const status = String(subscription?.status || '').toLowerCase();

        const activeLike = ['active', 'trial', 'trialing', 'grace'].includes(status);
        const graceEnd = subscription?.metadata?.graceEndDate || null;

        setSubscriptionStatus(status);
        setGraceEndDate(graceEnd ? new Date(graceEnd).toISOString() : null);
        setInGrace(status === 'grace');
        setIsFreeBlocked(status === 'locked' || !activeLike);
      } catch {
        setSubscriptionStatus('locked');
        setGraceEndDate(null);
        setIsFreeBlocked(true);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    void checkSubscription();
  }, [isOpen]);

  // Reset state when drawer closes
  const handleClose = () => {
    setStep('calendar');
    setCalendarSelection(null);
    setBookingOptions(null);
    setSelectedProviderType(initialProviderType);
    setSelectedProviders([]);
    onClose();
  };

  // Handle successful flow completion
  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  if (!isOpen) return null;

  const getStepTitle = (): string => {
    const titles: Record<FlowStep, string> = {
      'calendar': 'Book a Session',
      'provider-selection': 'Choose Providers',
      'pre-payment': 'Confirm & Pay',
      'success': 'Booking Created',
    };
    return titles[step];
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-charcoal/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-calm-sage/15 bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal">{getStepTitle()}</h2>
              <div className="flex gap-1 mt-2">
                {flowSteps.map(
                  (s, i) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all ${step === s
                        ? 'bg-teal-500'
                        : flowSteps.indexOf(step) > i
                          ? 'bg-teal-200'
                          : 'bg-calm-sage/15'
                        }`}
                    />
                  )
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-charcoal/40 transition-colors hover:bg-calm-sage/10 hover:text-charcoal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isCheckingSubscription && (
              <div className="rounded-xl border border-calm-sage/20 bg-calm-sage/5 p-4 text-sm text-charcoal/70">
                Checking subscription eligibility...
              </div>
            )}

            {!isCheckingSubscription && inGrace && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Grace period active until {graceEndDate ? new Date(graceEndDate).toLocaleString() : 'soon'}. Renew now to avoid lock.
                </p>
              </div>
            )}

            {!isCheckingSubscription && isFreeBlocked && (
              <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="text-base font-semibold text-red-900">Smart Match is currently blocked</h3>
                <p className="text-sm text-red-800">
                  {subscriptionStatus === 'locked'
                    ? 'Your subscription is locked. Renew now to continue V3 smart matching.'
                    : 'Free or inactive plans cannot use V3 smart matching. Upgrade to continue.'}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    disabled
                    className="rounded-lg bg-red-200 px-4 py-2 text-sm font-semibold text-red-800 cursor-not-allowed"
                  >
                    Upgrade or Renew to continue
                  </button>
                  <button
                    onClick={() => navigate('/plans')}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Upgrade or Renew
                  </button>
                  <button
                    onClick={handleClose}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {!isCheckingSubscription && !isFreeBlocked && step === 'calendar' && (
              <CalendarSelection
                onDateTimeSelect={(date, time, options) => {
                  setCalendarSelection({ date, time });
                  setBookingOptions(options);
                  setMatchPreferences((prev) => ({
                    ...prev,
                    concerns: options.concerns,
                    mode: options.appointmentType,
                  }));
                  setSelectedProviderType(initialProviderType);
                  setStep('pre-payment');
                }}
                onCancel={handleClose}
              />
            )}

            {!isCheckingSubscription && !isFreeBlocked && step === 'provider-selection' && calendarSelection && (
              <ProviderSelectionStep
                availabilityPrefs={getAvailabilityPrefs()!}
                selectedDate={calendarSelection.date}
                providerType={selectedProviderType}
                presetEntryType={presetEntryType}
                sourceFunnel={sourceFunnel}
                timezoneRegion={timezoneRegion}
                onPreferencesChange={setMatchPreferences}
                onSuccess={(providers: any) => {
                  // Convert ProviderMatch to SelectedProvider format
                  const selectedProviders = providers.map((p: any) => ({
                    id: p.id,
                    name: p.name || p.displayName || 'Provider',
                    type: p.providerType || 'Therapist',
                    fee: nriFixedFeeMinor || p.consultationFee || 69900,
                    score: p.score,
                    tier: p.tier,
                    matchBand: p.matchBand,
                    breakdown: p.breakdown,
                  }));
                  setSelectedProviders(selectedProviders);
                  setStep('pre-payment');
                }}
                onBack={() => {
                  setStep('calendar');
                }}
                onCancel={handleClose}
              />
            )}

            {!isCheckingSubscription && !isFreeBlocked && step === 'pre-payment' && calendarSelection && bookingOptions && (
              <PreBookingPaymentStep
                selectedProviders={selectedProviders}
                selectedDateTime={calendarSelection}
                presetEntryType={presetEntryType}
                sourceFunnel={sourceFunnel}
                timezoneRegion={timezoneRegion}
                matchPreferences={matchPreferences}
                bookingOptions={bookingOptions}
                onSuccess={() => {
                  // Save summary to session storage so SessionsPage shows it
                  const summary = {
                    selectedDate: calendarSelection.date.toISOString(),
                    selectedTime: calendarSelection.time,
                    preferences: matchPreferences,
                  };
                  window.sessionStorage.setItem('manas360.smartmatch.lastSummary', JSON.stringify(summary));
                  setStep('success');
                }}
                onBack={() => setStep('calendar')}
                onCancel={handleClose}
              />
            )}

            {!isCheckingSubscription && !isFreeBlocked && step === 'success' && (
              <div className="flex h-full flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95 duration-500 py-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <Check className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-charcoal">Booking Request Created!</h3>
                  <p className="text-sm text-charcoal/60 max-w-md mx-auto">
                    Your payment was successfully verified. Your request has been generated in the marketplace, and eligible providers have been notified.
                  </p>
                </div>

                {calendarSelection && (
                  <div className="rounded-xl border border-calm-sage/15 bg-calm-sage/5 p-4 text-left text-xs text-charcoal/70 w-full max-w-sm space-y-1">
                    <p className="font-semibold text-charcoal">Details:</p>
                    <p>• Date: {calendarSelection.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                    <p>• Time: {calendarSelection.time}</p>
                    {matchPreferences?.concerns && matchPreferences.concerns.length > 0 && (
                      <p>• Concerns: {matchPreferences.concerns.join(', ')}</p>
                    )}
                    {matchPreferences?.mode && (
                      <p>• Type: {matchPreferences.mode}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSuccess}
                  className="rounded-xl bg-gradient-calm px-6 py-3 text-sm font-semibold text-white transition hover:bg-none hover:bg-[var(--brand-navy-hover)] w-full max-w-xs"
                >
                  Go to My Care Hub
                </button>
              </div>
            )}
          </div>
      </div>
    </>,
    document.body
  );
}
