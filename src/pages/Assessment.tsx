import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { theme } from '../theme/theme';
import { getApiErrorMessage } from '../api/auth';
import { publicHttp } from '../api/publicHttp';
import {
  writeCachedClinicalScreening,
  writeGuestScreeningResult,
} from '../utils/guestScreeningCache';
import Button from '../components/ui/Button';

interface AssessmentProps {
  onSubmit: (data: any) => void;
}

const ASSESSMENT_ANSWERS_STORAGE_KEY = 'manas360-phq9-screening-answers';

type StoredAssessmentAnswer = {
  questionId: string;
  optionIndex: number;
};

function readStoredAnswers(): StoredAssessmentAnswer[] {
  try {
    const raw = localStorage.getItem(ASSESSMENT_ANSWERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredAssessmentAnswer =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as StoredAssessmentAnswer).questionId === 'string' &&
        typeof (item as StoredAssessmentAnswer).optionIndex === 'number' &&
        Number.isFinite((item as StoredAssessmentAnswer).optionIndex),
    );
  } catch {
    return [];
  }
}

function writeStoredAnswers(answersArray: StoredAssessmentAnswer[]): void {
  try {
    if (answersArray.length === 0) {
      localStorage.removeItem(ASSESSMENT_ANSWERS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(ASSESSMENT_ANSWERS_STORAGE_KEY, JSON.stringify(answersArray));
  } catch {
    // ignore quota / private mode errors
  }
}

function clearStoredAnswers(): void {
  try {
    localStorage.removeItem(ASSESSMENT_ANSWERS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function answersRecordFromArray(arr: StoredAssessmentAnswer[]): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, { questionId, optionIndex }) => {
    acc[questionId] = optionIndex;
    return acc;
  }, {});
}

function answersArrayFromRecord(record: Record<string, number>): StoredAssessmentAnswer[] {
  return Object.entries(record).map(([questionId, optionIndex]) => ({
    questionId,
    optionIndex,
  }));
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91', country: 'India' },
  { code: '+1', label: '🇺🇸 +1', country: 'USA/Canada' },
  { code: '+44', label: '🇬🇧 +44', country: 'UK' },
  { code: '+61', label: '🇦🇺 +61', country: 'Australia' },
  { code: '+971', label: '🇦🇪 +971', country: 'UAE' },
  { code: '+65', label: '🇸🇬 +65', country: 'Singapore' },
  { code: '+60', label: '🇲🇾 +60', country: 'Malaysia' },
  { code: '+49', label: '🇩🇪 +49', country: 'Germany' },
  { code: '+33', label: '🇫🇷 +33', country: 'France' },
  { code: '+81', label: '🇯🇵 +81', country: 'Japan' },
];

type ModalStep = 'phone';

export const Assessment: React.FC<AssessmentProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [attemptId, setAttemptId] = useState<string>('');
  const [attemptToken, setAttemptToken] = useState<string>('');
  const [questions, setQuestions] = useState<Array<{
    questionId: string;
    prompt: string;
    sectionKey: string;
    options: Array<{ optionIndex: number; label: string }>;
  }>>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // Phone + OTP modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [, setModalStep] = useState<ModalStep>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  // Pending result to pass to onSubmit
  const pendingResultRef = useRef<any>(null);

  useEffect(() => {
    const loadAssessment = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicHttp.post('/v1/free-screening/start', {});
        const data = res.data?.data ?? res.data;

        if (data?.attemptId) {
          setAttemptId(data.attemptId);
        }
        if (data?.attemptToken) {
          setAttemptToken(data.attemptToken);
        }

        const loadedQuestions = data?.questions || [];
        setQuestions(loadedQuestions);

        const validQuestionIds = new Set(loadedQuestions.map((q: any) => q.questionId));
        const restored = readStoredAnswers().filter((item) => validQuestionIds.has(item.questionId));
        if (restored.length > 0) {
          setAnswers(answersRecordFromArray(restored));
        }
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Unable to load assessment. Please refresh and try again.'));
      } finally {
        setLoading(false);
      }
    };

    void loadAssessment();
  }, []);

  useEffect(() => {
    if (loading) return;
    writeStoredAnswers(answersArrayFromRecord(answers));
  }, [answers, loading]);



  const setAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinish = async () => {
    if (questions.length === 0) {
      setError('Screening is not ready yet. Please refresh and try again.');
      return;
    }

    const answersPayload = questions.map((question) => ({
      questionId: question.questionId,
      optionIndex: Number(answers[question.questionId]),
    }));

    const hasMissing = answersPayload.some((answer) => Number.isNaN(answer.optionIndex));
    if (hasMissing) {
      setError('Please answer all questions before submitting.');
      return;
    }

    // Open phone modal to collect phone number before submitting
    setShowPhoneModal(true);
    setModalStep('phone');
    setModalError('');
    setPhoneNumber('');
  };

  const handleSubmitPhone = async () => {
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      setModalError('Please enter your phone number.');
      return;
    }
    if (!/^\d{6,15}$/.test(trimmedPhone)) {
      setModalError('Please enter a valid phone number (digits only).');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const fullPhone = `${countryCode}${trimmedPhone}`;

      const answersPayload = questions.map((question) => ({
        questionId: question.questionId,
        optionIndex: Number(answers[question.questionId]),
      }));

      // Submit the assessment with the phone number
      const submitRes = await publicHttp.post(`/v1/free-screening/${encodeURIComponent(attemptId)}/submit`, {
        attemptToken: attemptToken,
        phone: fullPhone, // Sending the collected phone number
        answers: answersPayload,
      });

      const responseData = submitRes.data?.data ?? submitRes.data;

      // Check if user is already registered
      if (responseData.isExistingUser) {
        setShowPhoneModal(false);
        toast.error('To see your score you need to login your account', {
          duration: 6000,
          style: {
            borderRadius: '16px',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: '500',
          },
          icon: '🔐',
        });
        navigate('/auth/login', { replace: true });
        return;
      }

      // New user scenario
      const numericAnswers = answersPayload.map((item) => Number(item.optionIndex));

      writeCachedClinicalScreening({ type: 'PHQ-9', answers: numericAnswers });
      writeGuestScreeningResult({
        type: 'PHQ-9',
        totalScore: responseData.totalScore,
        severityLevel: responseData.severityLevel,
        interpretation: responseData.interpretation,
        recommendation: responseData.actionLabel || responseData.recommendation || '',
        nextActions: [responseData.actionLabel || responseData.recommendation || ''],
        crisisDetected: String(responseData.severityLevel).toLowerCase() === 'severe',
      });

      clearStoredAnswers();

      pendingResultRef.current = {
        totalScore: responseData.totalScore,
        severityLevel: responseData.severityLevel,
        interpretation: responseData.interpretation,
        recommendation: responseData.actionLabel || responseData.recommendation || '',
        action: responseData.actionLabel || responseData.recommendation || '',
        nextActions: [responseData.actionLabel || responseData.recommendation || ''],
        templateKey: 'PHQ-9',
        crisisDetected: String(responseData.severityLevel).toLowerCase() === 'severe',
      };

      // Call onSubmit with the pending result
      if (pendingResultRef.current) {
        onSubmit(pendingResultRef.current);
      }

      // Hide modal and go straight to results
      setShowPhoneModal(false);
      navigate('/results', { replace: true });
    } catch (err: any) {
      const msg = getApiErrorMessage(err, '');
      const errResponseData = err?.response?.data?.data ?? err?.response?.data;
      const isExisting =
        err?.response?.status === 409 ||
        errResponseData?.isExistingUser === true ||
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('exists') ||
        msg.toLowerCase().includes('registered') ||
        msg.toLowerCase().includes('account');

      if (isExisting) {
        setShowPhoneModal(false);
        toast.error('To see your score you need to login your account', {
          duration: 6000,
          style: {
            borderRadius: '16px',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: '500',
          },
          icon: '🔐',
        });
        navigate('/auth/login', { replace: true });
        return;
      }

      setModalError(msg || 'Failed to submit screening. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowPhoneModal(false);
    setModalStep('phone');
    setModalError('');
    setPhoneNumber('');
  };

  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question.questionId] !== undefined).length,
    [answers, questions],
  );
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <>
      <div className="responsive-page bg-wellness-bg animate-fadeIn">
        <div className="responsive-container section-stack py-8 sm:py-12">
          <div className="w-full max-w-screen-lg mx-auto flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div
              className="font-serif text-2xl font-normal text-wellness-text tracking-wide cursor-pointer hover:opacity-80 transition-smooth"
              onClick={() => navigate('/landing')}
            >
              MANAS<span className="font-semibold text-calm-sage">360</span>
            </div>
            <div className="text-sm font-medium text-wellness-text bg-calm-sage/15 px-5 py-2 rounded-full">
              Screening
            </div>
          </div>

          <div className="w-full max-w-screen-xl mx-auto section-stack gap-12 sm:gap-16 lg:gap-20">
            {loading ? (
              <section>
                <h2 className="font-serif text-2xl sm:text-3xl text-wellness-text mb-2 leading-tight font-light">
                  Loading your screening...
                </h2>
                <p className="text-sm text-wellness-muted">Preparing questions</p>
              </section>
            ) : null}

            {!loading && questions.length > 0 ? (
              <section className="max-w-screen-xl mx-auto">
                <div className="mb-8">
                  <p className="text-sm font-medium text-wellness-muted">
                    {answeredCount} of {questions.length} answered
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-calm-sage/15">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%`, backgroundColor: theme.colors.brandTopbar }}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const selectedValue = answers[question.questionId];
                    return (
                      <div key={question.questionId} className="rounded-[28px] border border-calm-sage/10 bg-white/5 p-4 sm:p-6">
                        <h2 className="font-serif text-2xl sm:text-3xl text-wellness-text mb-1 leading-tight font-light">
                          {index + 1}. {question.prompt}
                        </h2>

                        <p className="text-sm text-wellness-muted mb-3">
                          Choose one answer below.
                        </p>

                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {question.options.map((option) => {
                            const isSelected = selectedValue === option.optionIndex;
                            return (
                              <button
                                key={`${question.questionId}-${option.optionIndex}`}
                                onClick={() => setAnswer(question.questionId, option.optionIndex)}
                                className={`
                                    w-full px-7 py-3 rounded-2xl text-base font-medium transition-smooth border-2 text-left flex justify-between items-center
                                    ${isSelected
                                    ? 'text-white shadow-soft-lg ring-2 ring-white/20 scale-[1.01]'
                                    : 'bg-white text-wellness-text border-calm-sage/20 hover:border-calm-sage/40 hover:bg-calm-sage/5'
                                  }
                                  `}
                                style={isSelected
                                  ? { backgroundColor: theme.colors.brandTopbar, borderColor: theme.colors.brandTopbar }
                                  : undefined}
                              >
                                {option.label}
                                {isSelected && <span className="text-xl">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="pt-4 pb-20">
              <button
                onClick={handleFinish}
                disabled={loading || submitting || questions.length === 0 || answeredCount !== questions.length}
                className={`
                  responsive-action-btn w-full !rounded-lg text-lg font-semibold tracking-wide transition-smooth shadow-soft-md
                  ${(loading || submitting || questions.length === 0 || answeredCount !== questions.length)
                    ? 'bg-wellness-surface text-wellness-muted cursor-not-allowed'
                    : 'bg-gradient-calm text-white hover:bg-none hover:bg-[var(--brand-navy-hover)] hover:shadow-soft-lg'
                  }
                `}
              >
                {submitting ? 'Submitting...' : 'Submit • Analyze My Results'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phone + OTP Modal */}
      {showPhoneModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10, 15, 40, 0.75)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div
            className="relative w-full max-w-md animate-fadeIn"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)',
              borderRadius: '28px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="p-7 sm:p-8">
              {/* Header */}
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-1">
                  Verify your number
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enter your phone number to receive your personalized results.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Country Code
                  </label>
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-800 bg-white appearance-none transition-colors duration-200"
                      style={{ cursor: 'pointer' }}
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.label} — {cc.country}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="flex items-center px-3 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 whitespace-nowrap select-none"
                    >
                      {countryCode}
                    </div>
                    <input
                      id="assessment-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitPhone(); }}
                      autoComplete="tel"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm text-gray-800 placeholder-gray-400 transition-colors duration-200"
                    />
                  </div>
                </div>

                {modalError && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-red-500 text-xs mt-0.5">⚠</span>
                    <p className="text-xs text-red-700">{modalError}</p>
                  </div>
                )}

                <Button
                  type="button"
                  fullWidth
                  loading={modalLoading}
                  className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
                  onClick={handleSubmitPhone}
                >
                  {modalLoading ? 'Analyzing...' : 'Analyze My Results'}
                </Button>
              </div>

              <p className="text-xs text-center text-gray-400 mt-5">
                🔒 Your data is secure and never shared without consent.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
