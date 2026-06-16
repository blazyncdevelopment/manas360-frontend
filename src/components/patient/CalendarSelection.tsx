import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { patientApi } from '../../api/patient';
import { FRONTEND_URL } from '../../lib/runtimeEnv';
import { toDisplayTimeParts, getEquivalentIstTime } from '../../utils/timezoneUtils';

export type MarketplaceBookingOptions = {
  concerns: string[];
  appointmentType: 'video' | 'audio';
  patientTimezone?: string;
};

interface CalendarSelectionProps {
  onDateTimeSelect: (date: Date, time: string, options: MarketplaceBookingOptions) => void;
  onCancel: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  availableCount: number | null;
}

type SelectionStep = 'calendar' | 'time-slots';

const SLOT_TEMPLATES: Array<{ startTime: string; endTime: string }> = [
  { startTime: '09:00', endTime: '09:30' },
  { startTime: '10:00', endTime: '10:30' },
  { startTime: '14:00', endTime: '14:30' },
  { startTime: '15:00', endTime: '15:30' },
  { startTime: '18:00', endTime: '18:30' },
];

const toMinuteOfDay = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h * 60) + (m || 0);
};

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'IST (Asia/Kolkata)' },
  { value: 'America/New_York', label: 'EST/EDT (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'PST/PDT (America/Los_Angeles)' },
  { value: 'Europe/London', label: 'GMT/BST (Europe/London)' },
  { value: 'Australia/Sydney', label: 'AEST/AEDT (Australia/Sydney)' },
  { value: 'Asia/Dubai', label: 'GST (Asia/Dubai)' }
];

export default function CalendarSelection({ onDateTimeSelect, onCancel }: CalendarSelectionProps) {
  const [step, setStep] = useState<SelectionStep>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    SLOT_TEMPLATES.map((slot) => ({ ...slot, availableCount: null })),
  );
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);
  const [concernsInput, setConcernsInput] = useState('');
  const [appointmentType, setAppointmentType] = useState<'video' | 'audio'>('video');
  const [patientTimezone, setPatientTimezone] = useState<string>('Asia/Kolkata');

  useEffect(() => {
    if (!selectedDate || step !== 'time-slots') return;

    const loadAvailability = async () => {
      setTimeSlotsLoading(true);
      setTimeSlotsError(null);
      try {
        const day = selectedDate.getDay();
        const results = await Promise.all(
          SLOT_TEMPLATES.map(async (slot) => {
            try {
              const startMinute = toMinuteOfDay(slot.startTime);
              const endMinute = toMinuteOfDay(slot.endTime);
              const response = await patientApi.getAvailableProvidersForSmartMatch(
                { daysOfWeek: [day], timeSlots: [{ startMinute, endMinute }] },
                undefined,
                { context: 'Standard', selectedDate: selectedDate.toISOString() },
              );
              const count = Number(response?.count ?? (response as any)?.data?.count ?? (response as any)?.providers?.length ?? 0);
              return { ...slot, availableCount: Number.isFinite(count) ? count : 0 };
            } catch {
              // Can't determine count — still show the slot as selectable
              return { ...slot, availableCount: null };
            }
          }),
        );
        setTimeSlots(results);
      } catch (err) {
        // Even on total failure, show slots so user can still pick a time
        setTimeSlots(SLOT_TEMPLATES.map((slot) => ({ ...slot, availableCount: null })));
      } finally {
        setTimeSlotsLoading(false);
      }
    };

    void loadAvailability();
  }, [selectedDate, step]);

  // Get calendar days for current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const isDateAvailable = (day: number): boolean => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    if (isDateAvailable(day)) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(date);
      setStep('time-slots');
      setSelectedTime(null);
      setConcernsInput('');
      setAppointmentType('video');
      setTimeSlotsError(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Calendar Step */}
      {step === 'calendar' && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-charcoal/50">
              <Clock className="mr-2 inline h-4 w-4" />
              Your Timezone
            </label>
            <select
              value={patientTimezone}
              onChange={(e) => setPatientTimezone(e.target.value)}
              className="w-full rounded-lg border border-calm-sage/30 bg-white px-3 py-2 text-sm text-charcoal focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-charcoal/50">Session times will be displayed in this timezone</p>
          </div>

          {/* Month/Year Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-2 hover:bg-calm-sage/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-charcoal" />
            </button>
            <h3 className="text-lg font-semibold text-charcoal">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-2 hover:bg-calm-sage/10 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-charcoal" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-charcoal/60 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const available = isDateAvailable(day);
              const selected = isDateSelected(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  disabled={!available}
                  className={`relative rounded-lg py-2 text-sm font-medium transition-all ${selected
                      ? 'bg-teal-500 text-white shadow-md'
                      : available
                        ? 'bg-calm-sage/10 text-charcoal hover:bg-teal-50 hover:border-teal-300'
                        : 'text-charcoal/30 cursor-not-allowed'
                    } border border-transparent hover:border-teal-300`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Slots Step */}
      {step === 'time-slots' && selectedDate && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-charcoal/60 mb-4">
              Available times for{' '}
              <span className="font-semibold text-charcoal">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
            <div className="space-y-2">
              {timeSlotsLoading && (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-calm-sage/20 bg-calm-sage/5 px-4 py-3 text-sm text-charcoal/70">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  Checking live provider availability...
                </div>
              )}

              {timeSlotsError && timeSlotsError.startsWith('SUBSCRIPTION_REQUIRED:') ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-col items-center">
                  <div className="mb-2 font-semibold">Subscribe to platform fee to check provider availability.</div>
                  <div className="mb-2">{timeSlotsError.replace('SUBSCRIPTION_REQUIRED:', '')}</div>
                  <button
                    className="rounded-lg bg-teal-600 px-4 py-2 text-white font-semibold mt-2 hover:bg-teal-700 transition-colors"
                    onClick={() => {
                      const returnTo = window.location.pathname + window.location.search + window.location.hash;
                      const redirectPath = `/plans?returnTo=${encodeURIComponent(returnTo)}`;
                      window.location.href = `${FRONTEND_URL}/payment/status?id=SUB_653d1e79_1774602028060&status=SUCCESS&redirect=${encodeURIComponent(redirectPath)}`;
                    }}
                  >
                    Subscribe to Platform Fee
                  </button>
                </div>
              ) : timeSlotsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {timeSlotsError}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => {
                  const { time, abbr } = toDisplayTimeParts(slot.startTime, patientTimezone, selectedDate || new Date());
                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => {
                        if (timeSlotsLoading) return;
                        setSelectedTime(slot.startTime);
                      }}
                      disabled={timeSlotsLoading}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors flex flex-col items-center ${selectedTime === slot.startTime
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-calm-sage/20 text-charcoal/70 hover:border-teal-300 hover:bg-teal-50/50'
                        }`}
                    >
                      <span className="font-bold">{time}</span>
                      {abbr && <span className="text-[10px] opacity-75">({abbr})</span>}
                    </button>
                  );
                })}
              </div>

              {selectedTime && patientTimezone !== 'Asia/Kolkata' && (
                <p className="mt-3 text-center text-xs font-medium text-charcoal/60">
                  Equivalent to {getEquivalentIstTime(selectedTime, patientTimezone, selectedDate || new Date())} (IST)
                </p>
              )}

              {!timeSlotsLoading && timeSlots.every((s) => s.availableCount === 0) && (
                <p className="rounded-lg border border-calm-sage/20 bg-calm-sage/5 px-4 py-3 text-sm text-charcoal/70">
                  No providers matched for this time — you can still select a slot and we'll find the best match.
                </p>
              )}
            </div>
          </div>

          {selectedTime && (
            <div className="space-y-4 rounded-lg border border-calm-sage/20 bg-calm-sage/5 p-4">
              <div>
                <label htmlFor="booking-concerns" className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60">
                  Concerns
                </label>
                <input
                  id="booking-concerns"
                  type="text"
                  value={concernsInput}
                  onChange={(e) => setConcernsInput(e.target.value)}
                  placeholder="e.g. anxiety, depression"
                  className="mt-1.5 w-full rounded-lg border border-calm-sage/25 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <p className="mt-1 text-xs text-charcoal/50">Separate multiple concerns with commas</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">Appointment Type</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal">
                    <input
                      type="checkbox"
                      checked={appointmentType === 'video'}
                      onChange={() => setAppointmentType('video')}
                      className="h-4 w-4 rounded border-calm-sage/30 text-teal-600 focus:ring-teal-500"
                    />
                    Video
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal">
                    <input
                      type="checkbox"
                      checked={appointmentType === 'audio'}
                      onChange={() => setAppointmentType('audio')}
                      className="h-4 w-4 rounded border-calm-sage/30 text-teal-600 focus:ring-teal-500"
                    />
                    Audio
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const concerns = concernsInput
                    .split(',')
                    .map((c) => c.trim())
                    .filter(Boolean);
                  onDateTimeSelect(selectedDate, selectedTime, { concerns, appointmentType, patientTimezone });
                }}
                className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => setStep('calendar')}
            className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors"
          >
            ← Back to Calendar
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {step === 'calendar' && (
        <button
          onClick={onCancel}
          className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
