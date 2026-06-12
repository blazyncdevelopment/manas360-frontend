import { Activity, Brain, CheckCircle2, ClipboardList, Info, Mic, Minimize2, Music, RefreshCw, Send, StickyNote, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createPatientNote,
  fetchCbtAssignmentTemplates,
  fetchPatientOverview,
  quickAssignCbtTemplate,
  createSoundTherapyRx,
  createBehavioralRx,
  generateWellnessPlan,
  DISORDER_TAG_OPTIONS,
  BEHAVIORAL_RX_ITEMS,
  type CbtAssignmentTemplateOption,
  type PatientOverviewData,
  updatePatientNote,
} from '../../api/provider';
import { type AiClinicalSummary } from '../../api/therapist.api';
import { generateMeetingLink, type MeetingLinkResponse } from '../../api/videoSession';
import VideoRoom from '../../components/jitsi/VideoRoom';
import { StatusLight, type ConnectionStatus } from '../../components/shared/StatusLight';
import GPSDashboard from '../../components/therapist/GPSDashboard';
import useAuthToken from '../../hooks/useAuthToken';
import { http } from '../../lib/http';
import { AI_ENGINE_WS_URL } from '../../lib/runtimeEnv';
import { useAuth } from '../../context/AuthContext';
import { useVideoSession } from '../../context/VideoSessionContext';

const providerRoles = new Set(['therapist', 'psychiatrist', 'psychologist', 'coach']);
const MIN_AUDIO_CAPTURE_SECONDS = 15;
type WorkspaceTab = 'patient-info' | 'clinical-notes' | 'prescriptions' | 'ai-insights';








const formatSessionDate = (value?: string | null): string => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function VideoSessionPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startSession, endSession, setIsMinimized, elapsedSeconds } = useVideoSession();

  const [meetingData, setMeetingData] = useState<MeetingLinkResponse | null>(null);
  const [patientOverview, setPatientOverview] = useState<PatientOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState('');
  const [objectiveNotes, setObjectiveNotes] = useState('');
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [isGeneratingAiDraft] = useState(false);
  const [aiInsights] = useState<AiClinicalSummary | null>(null);
  const [cbtTemplateOptions, setCbtTemplateOptions] = useState<CbtAssignmentTemplateOption[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [isAssigningCbtTemplate, setIsAssigningCbtTemplate] = useState(false);
  const [quickAssignFeedback, setQuickAssignFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('patient-info');
  const [isOverviewOverlayOpen, setIsOverviewOverlayOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('good');
  const [, setVoiceEmpathyScore] = useState<number>(70);
  const [voiceEmpathyReason, setVoiceEmpathyReason] = useState('Waiting for voice input');
  const [, setCrisisDetected] = useState(false);
  const [crisisModalDismissed, setCrisisModalDismissed] = useState(false);
  const [aiInsightInput, setAiInsightInput] = useState('');
  const [voiceMessages, setVoiceMessages] = useState<{ text: string; timestamp: string }[]>([]);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [isSpeechAutoEnabled, setIsSpeechAutoEnabled] = useState(false);
  const [hasSpeechPermission, setHasSpeechPermission] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  const [monitoringId, setMonitoringId] = useState<string>('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [therapistJoined, setTherapistJoined] = useState(false);
  const [patientSessionEnded, setPatientSessionEnded] = useState(false);
  const [selectedDisorderTag, setSelectedDisorderTag] = useState('anxiety');
  const [selectedBehavioralItems, setSelectedBehavioralItems] = useState<string[]>([]);
  const [rxSubmitting, setRxSubmitting] = useState<string | null>(null);
  const [rxFeedback, setRxFeedback] = useState<string | null>(null);
  const [wellnessPlanSubmitting, setWellnessPlanSubmitting] = useState(false);
  const [showPostSession, setShowPostSession] = useState(false);
  const [sessionOutcome, setSessionOutcome] = useState<'continue' | 'rebook' | 'discharge' | null>(null);
  const [postAssigned, setPostAssigned] = useState<Set<string>>(new Set());

  const markAssigned = (key: string) => setPostAssigned((prev) => new Set([...prev, key]));

  const submitSessionDecision = async (outcome: 'continue' | 'rebook' | 'discharge') => {
    setDecisionSubmitting(true);
    try {
      await http.post(`/v1/provider/sessions/${encodeURIComponent(sessionId)}/decision`, { outcome });
    } catch {
      // non-critical — show post-session panel regardless
    } finally {
      setDecisionSubmitting(false);
      setSessionOutcome(outcome);
      setShowDecisionModal(false);
      setShowPostSession(true);
    }
  };

  const handleCompleteAndExit = () => {
    endSession();
    if (sessionOutcome === 'rebook') {
      navigate('/provider/appointments?action=rebook');
    } else {
      navigate('/provider/dashboard');
    }
  };

  const { token: accessToken } = useAuthToken();

  const saveInFlightRef = useRef(false);
  const lastSavedPayloadRef = useRef('');
  const savedIndicatorTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechBaseTextRef = useRef('');
  const speechFinalTextRef = useRef('');
  const aiInsightInputRef = useRef('');
  const speechSilenceTimerRef = useRef<number | null>(null);
  const voiceMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  const normalizedRole = String(user?.role || '').toLowerCase();
  const isProvider = providerRoles.has(normalizedRole);
  const displayName = useMemo(() => {
    const full = `${String(user?.firstName || '').trim()} ${String(user?.lastName || '').trim()}`.trim();
    return full || String(user?.email || (isProvider ? 'Provider' : 'Patient'));
  }, [user?.email, user?.firstName, user?.lastName, isProvider]);
  const isSpeechSupported = false; // Disabled in favor of AI Engine transcriptions

  useEffect(() => {
    let active = true;

    if (hasAuthError) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const fetchMeetingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await generateMeetingLink(sessionId);
        if (!active) return;

        setMeetingData(response);
        setNoteId(response.noteId || null);
        if (response.noteSubjective) {
          setQuickNotes(response.noteSubjective);
        }
        const initialSnapshot = JSON.stringify({
          subjective: response.noteSubjective || '',
          objective: '',
          assessment: '',
          plan: '',
        });
        lastSavedPayloadRef.current = initialSnapshot;

        startSession({
          sessionId,
          roomName: response.meetingRoomName,
          jitsiJwt: response.jitsiJwt,
        });
      } catch (requestError: any) {
        if (!active) return;
        if (requestError?.response?.status === 401) {
          setHasAuthError(true);
          setError(null);
          return;
        }
        setError(String(requestError?.response?.data?.message || requestError?.message || 'Unable to load meeting room'));
      } finally {
        if (active) setLoading(false);
      }
    };

    if (sessionId && (isProvider || normalizedRole === 'patient')) {
      void fetchMeetingData();
    } else {
      setLoading(false);
      setError('Session id is missing or role is not supported for video workspace');
    }

    return () => {
      active = false;
    };
  }, [hasAuthError, isProvider, normalizedRole, sessionId, startSession]);

  useEffect(() => {
    let active = true;

    if (hasAuthError) {
      setIsLoadingOverview(false);
      return () => {
        active = false;
      };
    }

    const loadPatientOverview = async () => {
      if (!meetingData?.patientId) return;

      setIsLoadingOverview(true);
      try {
        const overview = await fetchPatientOverview(meetingData.patientId);
        if (!active) return;
        setPatientOverview(overview);
      } catch (requestError: any) {
        if (!active) return;
        if (requestError?.response?.status === 401) {
          setHasAuthError(true);
          return;
        }
        setPatientOverview(null);
      } finally {
        if (active) setIsLoadingOverview(false);
      }
    };

    void loadPatientOverview();

    return () => {
      active = false;
    };
  }, [hasAuthError, meetingData?.patientId]);

  // Start GPS Monitoring session
  useEffect(() => {
    if (!sessionId || !isProvider) return;
    let cancelled = false;

    const startGps = async () => {
      try {
        const res = await http.post<{ monitoringId: string }>(`/v1/gps/sessions/${sessionId}/start`);
        if (!cancelled) {
          setMonitoringId(res.data?.monitoringId || '');
        }
      } catch (err) {
        console.warn('[VideoSessionPage] Failed to start GPS monitoring:', err);
      }
    };

    void startGps();

    return () => {
      cancelled = true;
      if (sessionId) {
        void http.post(`/v1/gps/sessions/${sessionId}/end`).catch(() => {});
      }
    };
  }, [sessionId, isProvider]);

  useEffect(() => {
    return () => {
      if (savedIndicatorTimerRef.current) {
        window.clearTimeout(savedIndicatorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (hasAuthError || !isProvider) {
      return () => {
        active = false;
      };
    }

    const loadTemplateOptions = async () => {
      try {
        const templates = await fetchCbtAssignmentTemplates();
        if (!active) return;
        const options = Array.isArray(templates) ? templates : [];
        setCbtTemplateOptions(options);
        setSelectedTemplateType((current) => current || options[0]?.templateType || '');
      } catch {
        if (!active) return;
        setCbtTemplateOptions([]);
      }
    };

    void loadTemplateOptions();

    return () => {
      active = false;
    };
  }, [hasAuthError, isProvider]);

  // Voice-driven empathy traffic light (Real-time AI Engine integration)
  const handleGPSUpdate = useCallback((metrics: Record<string, any>) => {
    const empathyScore = Number(metrics.empathyScore || 0);
    const crisisRisk = String(metrics.crisisRisk || 'low').toLowerCase();
    const sentiment = String(metrics.sentiment || 'neutral').toLowerCase();
    const suggestion = String(metrics.aiSuggestion || '');

    let status: ConnectionStatus = 'good';
    if (crisisRisk === 'high' || empathyScore < 40) {
      status = 'poor';
    } else if (empathyScore < 70 || sentiment === 'negative') {
      status = 'caution';
    }

    setConnectionStatus(status);
    setVoiceEmpathyScore(empathyScore);
    setVoiceEmpathyReason(suggestion || `Empathy: ${empathyScore}% | ${sentiment.toUpperCase()}`);
    setCrisisDetected(crisisRisk === 'high');
  }, []);

  const handleTranscriptUpdate = useCallback((transcript: Record<string, any>) => {
    const text = String(transcript.text || '').trim();
    if (!text) return;

    setVoiceMessages((prev) => {
      const timestamp = new Date()
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [...prev, { text, timestamp }];
    });
  }, []);

  useEffect(() => {
    if (!voiceMessagesContainerRef.current) return;
    voiceMessagesContainerRef.current.scrollTop = voiceMessagesContainerRef.current.scrollHeight;
  }, [voiceMessages]);

  useEffect(() => {
    if (connectionStatus !== 'poor') {
      setCrisisModalDismissed(false);
    }
  }, [connectionStatus]);

  const autosaveNotes = useCallback(async () => {
    if (hasAuthError) return;
    if (!isProvider) return;
    if (!meetingData?.patientId) return;

    const notePayload = {
      subjective: quickNotes.trim(),
      objective: objectiveNotes.trim(),
      assessment: assessmentNotes.trim(),
      plan: planNotes.trim(),
    };
    const snapshot = JSON.stringify(notePayload);

    if (!notePayload.subjective && !notePayload.objective && !notePayload.assessment && !notePayload.plan) return;
    if (saveInFlightRef.current) return;
    if (snapshot === lastSavedPayloadRef.current) return;

    saveInFlightRef.current = true;

    try {
      const payload = {
        subjective: quickNotes,
        objective: objectiveNotes,
        assessment: assessmentNotes,
        plan: planNotes,
        sessionDate: new Date().toISOString(),
        sessionType: 'Video Session',
        duration: '50',
        status: 'Draft' as const,
      };

      try {
        if (noteId) {
          await updatePatientNote(meetingData.patientId, noteId, payload);
        } else {
          const created = await createPatientNote(meetingData.patientId, {
            ...payload,
            sessionId,
          });
          setNoteId(created.id);
        }
      } catch (requestError: any) {
        if (requestError?.response?.status === 401) {
          setHasAuthError(true);
          return;
        }
        throw requestError;
      }

      lastSavedPayloadRef.current = snapshot;
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setShowSavedIndicator(true);
      if (savedIndicatorTimerRef.current) {
        window.clearTimeout(savedIndicatorTimerRef.current);
      }
      savedIndicatorTimerRef.current = window.setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
    } finally {
      saveInFlightRef.current = false;
    }
  }, [assessmentNotes, hasAuthError, isProvider, meetingData?.patientId, noteId, objectiveNotes, planNotes, quickNotes, sessionId]);

  useEffect(() => {
    if (!isProvider) return;

    if (!quickNotes.trim() && !objectiveNotes.trim() && !assessmentNotes.trim() && !planNotes.trim()) {
      return;
    }

    const timer = window.setInterval(() => {
      void autosaveNotes();
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [assessmentNotes, autosaveNotes, isProvider, objectiveNotes, planNotes, quickNotes]);

  const aiUnlockCountdown = Math.max(0, MIN_AUDIO_CAPTURE_SECONDS - elapsedSeconds);
  const isMoodAnalyzing = aiUnlockCountdown > 0 || isGeneratingAiDraft;
  const latestPhq9 = useMemo(
    () => patientOverview?.recentAssessments?.find((item) => item.type === 'PHQ-9') || null,
    [patientOverview?.recentAssessments],
  );

  const moodMonitorLabel = useMemo(() => {
    if (aiUnlockCountdown > 0) {
      return 'Analyzing tone...';
    }

    const primaryMood = String(
      aiInsights?.moodSentiment?.primaryEmotionalState || aiInsights?.moodAnalysis?.emotionalTone || '',
    ).trim();
    if (primaryMood) {
      return `Sentiment: ${primaryMood}`;
    }

    if (isGeneratingAiDraft) {
      return 'Analyzing tone...';
    }

    return 'Analyzing tone...';
  }, [aiInsights, aiUnlockCountdown, isGeneratingAiDraft]);

  const moodMonitorToneClass = useMemo(() => {
    const normalized = moodMonitorLabel.toLowerCase();
    if (normalized.includes('anx')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (normalized.includes('depress') || normalized.includes('low')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (normalized.includes('calm') || normalized.includes('stable')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (normalized === 'analyzing tone...') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-sky-100 text-sky-700 border-sky-200';
  }, [moodMonitorLabel]);

  const handleQuickAssignTemplate = async () => {
    if (hasAuthError) return;
    if (!meetingData?.patientId) {
      setQuickAssignFeedback('Unable to identify patient for assignment.');
      return;
    }
    if (!selectedTemplateType || isAssigningCbtTemplate) {
      return;
    }

    setIsAssigningCbtTemplate(true);
    setQuickAssignFeedback(null);
    try {
      const result = await quickAssignCbtTemplate(meetingData.patientId, selectedTemplateType);
      setQuickAssignFeedback(`Assigned: ${result.title} to the patient Daily Check-in Hub.`);
    } catch (requestError: any) {
      if (requestError?.response?.status === 401) {
        setHasAuthError(true);
        return;
      }
      setQuickAssignFeedback(String(requestError?.response?.data?.message || requestError?.message || 'Failed to assign template.'));
    } finally {
      setIsAssigningCbtTemplate(false);
    }
  };

  const handleOpenDashboardInPip = () => {
    setIsMinimized(true);
    navigate('/provider/dashboard');
  };

  const clearSpeechSilenceTimer = useCallback(() => {
    if (speechSilenceTimerRef.current) {
      window.clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
  }, []);

  const commitVoiceMessage = useCallback((rawText?: string) => {
    const text = String(rawText ?? aiInsightInputRef.current).trim();
    if (!text) return;

    setVoiceMessages((previous) => {
      const last = previous[previous.length - 1];
      if (last?.text === text) return previous;
      const timestamp = new Date()
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        .replace(/\s/g, '');
      return [...previous, { text, timestamp }];
    });

    aiInsightInputRef.current = '';
    setAiInsightInput('');
    speechBaseTextRef.current = '';
    speechFinalTextRef.current = '';
    setSpeechStatus('Captured after 3s silence. Keep speaking to add more.');
  }, []);

  const queueSilenceCommit = useCallback((textToCommit: string) => {
    clearSpeechSilenceTimer();
    speechSilenceTimerRef.current = window.setTimeout(() => {
      commitVoiceMessage(textToCommit);
    }, 3000);
  }, [clearSpeechSilenceTimer, commitVoiceMessage]);

  const startSpeechRecognition = useCallback(async () => {
    if (!isSpeechSupported) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    if (speechRecognitionRef.current || isSpeechListening) {
      return;
    }

    if (!hasSpeechPermission && navigator.mediaDevices?.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStream.getTracks().forEach((track) => track.stop());
        setHasSpeechPermission(true);
      } catch {
        setSpeechError('Microphone permission is blocked. Please allow microphone access and try again.');
        setSpeechStatus(null);
        return;
      }
    }

    const browserWindow = window as any;
    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setSpeechError(null);
      setIsSpeechListening(true);
      setSpeechStatus('Listening... start speaking now.');
      clearSpeechSilenceTimer();
      speechBaseTextRef.current = aiInsightInput.trim();
      speechFinalTextRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let finalizedChunk = '';
      let interimChunk = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcriptPart = String(event.results[index]?.[0]?.transcript || '').trim();
        if (!transcriptPart) continue;
        if (event.results[index].isFinal) {
          finalizedChunk += `${transcriptPart} `;
        } else {
          interimChunk += `${transcriptPart} `;
        }
      }

      const normalizedFinalizedChunk = finalizedChunk.trim();
      if (normalizedFinalizedChunk) {
        speechFinalTextRef.current = `${speechFinalTextRef.current} ${normalizedFinalizedChunk}`.trim();
      }

      const composedText = `${speechBaseTextRef.current} ${speechFinalTextRef.current} ${interimChunk.trim()}`.trim();
      aiInsightInputRef.current = composedText;
      setAiInsightInput(composedText);
      setSpeechStatus(composedText ? 'Listening and transcribing...' : 'Listening...');
      if (composedText) {
        queueSilenceCommit(composedText);
      }
    };

    recognition.onerror = (event: any) => {
      const errorCode = String(event?.error || 'unknown');
      if (errorCode !== 'aborted') {
        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
          setSpeechError('Microphone permission is blocked. Please allow microphone access and try again.');
          setIsSpeechAutoEnabled(false);
          setSpeechStatus('Voice input stopped.');
        } else if (errorCode === 'audio-capture') {
          setSpeechError('No microphone was found. Connect a mic and try again.');
          setIsSpeechAutoEnabled(false);
          setSpeechStatus('Voice input stopped.');
        } else if (errorCode === 'network') {
          setSpeechError('Speech recognition service is unavailable in this browser session. If using Brave, enable Google speech services or try Chrome.');
          setIsSpeechAutoEnabled(false);
          setSpeechStatus('Voice input stopped.');
        } else if (errorCode === 'no-speech') {
          setSpeechError(null);
          setSpeechStatus('No speech detected. Keep talking...');
        } else {
          setSpeechError(`Could not capture speech (${errorCode}). Please try again.`);
          setIsSpeechAutoEnabled(false);
          setSpeechStatus('Voice input stopped.');
        }
      }
    };

    recognition.onend = () => {
      setIsSpeechListening(false);
      clearSpeechSilenceTimer();
      setSpeechStatus(isSpeechAutoEnabled ? 'Reconnecting microphone...' : null);
      speechRecognitionRef.current = null;
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  }, [aiInsightInput, clearSpeechSilenceTimer, hasSpeechPermission, isSpeechAutoEnabled, isSpeechListening, isSpeechSupported, queueSilenceCommit]);

  const handleToggleSpeechInput = useCallback(async () => {
    if (isSpeechAutoEnabled) {
      setIsSpeechAutoEnabled(false);
      setSpeechStatus(null);
      clearSpeechSilenceTimer();
      commitVoiceMessage();
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      return;
    }

    setIsSpeechAutoEnabled(true);
    setSpeechStatus('Starting microphone...');
    await startSpeechRecognition();
  }, [clearSpeechSilenceTimer, commitVoiceMessage, isSpeechAutoEnabled, startSpeechRecognition]);

  useEffect(() => {
    if (!isSpeechAutoEnabled) return;
    if (activeTab !== 'ai-insights') return;
    if (isSpeechListening) return;

    const restartTimer = window.setTimeout(() => {
      void startSpeechRecognition();
    }, 250);

    return () => {
      window.clearTimeout(restartTimer);
    };
  }, [activeTab, isSpeechAutoEnabled, isSpeechListening, startSpeechRecognition]);

  useEffect(() => {
    if (activeTab === 'ai-insights') return;
    if (!isSpeechAutoEnabled) return;
    setSpeechStatus(null);
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
  }, [activeTab, isSpeechAutoEnabled]);

  useEffect(() => {
    return () => {
      clearSpeechSilenceTimer();
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, [clearSpeechSilenceTimer]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <p className="text-sm font-semibold text-slate-600">Preparing secure video room...</p>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="flex h-[calc(100vh-2rem)] flex-col items-center justify-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-base font-semibold text-rose-700">Unable to open session workspace</p>
        <p className="text-sm text-rose-700/80">{error || 'Meeting room could not be loaded.'}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-700"
        >
          Back
        </button>
      </div>
    );
  }

  if (!isProvider) {
    if (patientSessionEnded) {
      return (
        <div className="flex h-[calc(100vh-2rem)] flex-col items-center justify-center gap-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Session Complete</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your session has ended. Your therapist will share a summary and next steps shortly.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => navigate('/patient/sessions')}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              View Session History
            </button>
            <button
              type="button"
              onClick={() => navigate('/patient/dashboard')}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Live Session</p>
              <p className="text-[11px] text-slate-300">Room: {meetingData.meetingRoomName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  endSession();
                  setPatientSessionEnded(true);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                <X className="h-3.5 w-3.5" />
                End Call
              </button>
            </div>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 animate-fade-in">
          {!therapistJoined && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-900 text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
              </div>
              <p className="text-base font-semibold">Waiting for your therapist to join...</p>
              <p className="text-xs text-slate-400">Your session is ready. Please stay on this page.</p>
            </div>
          )}
          <VideoRoom
            sessionId={sessionId}
            roomName={meetingData.meetingRoomName}
            displayName={displayName}
            jitsiJwt={meetingData.jitsiJwt}
            className="h-full w-full"
            onEndCall={() => {
              endSession();
              setPatientSessionEnded(true);
            }}
            onParticipantJoined={() => setTherapistJoined(true)}
            isTherapist={false}
            aiEngineUrl={AI_ENGINE_WS_URL}
            onGPSUpdate={handleGPSUpdate}
            onTranscriptUpdate={handleTranscriptUpdate}
          />
        </div>

        {connectionStatus === 'poor' && !crisisModalDismissed ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-3xl border-4 border-rose-400 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">ALERT</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">High Distress / Crisis Detected</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-slate-900 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white mb-3">Immediate Advice</p>
                <p className="text-sm italic text-white leading-relaxed">
                  "Please reach out for help immediately. Contact a suicide prevention hotline like Vandrevala Foundation (9999664555) or AASRA (9820466726) in India, or call your local emergency services. Do not stay alone; reach out to a trusted friend, family member, or healthcare professional right now."
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCrisisModalDismissed(true)}
                className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-700"
              >
                Understood
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-2rem)] grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Live Session</p>
              <p className="text-[11px] text-slate-300">Room: {meetingData.meetingRoomName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenDashboardInPip}
                className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Open Dashboard (PiP)
              </button>
              <button
                type="button"
                onClick={() => setShowDecisionModal(true)}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                <X className="h-3.5 w-3.5" />
                End Call
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <VideoRoom
            sessionId={sessionId}
            roomName={meetingData.meetingRoomName}
            displayName={displayName}
            jitsiJwt={meetingData.jitsiJwt}
            className="h-full w-full"
            onEndCall={() => setShowDecisionModal(true)}
            isTherapist={isProvider}
            aiEngineUrl={AI_ENGINE_WS_URL}
            onGPSUpdate={handleGPSUpdate}
            onTranscriptUpdate={handleTranscriptUpdate}
          />
        </div>
      </section>

      <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_minmax(220px,320px)_1fr] sm:gap-4">
            <p className="justify-self-start text-sm font-semibold text-slate-800 whitespace-nowrap">Clinical Workspace</p>
            <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
              <StatusLight status={connectionStatus} horizontal={true} />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">TherapeuticGPS from live voice input: {voiceEmpathyReason}</p>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('patient-info')}
              className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                activeTab === 'patient-info' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clinical-notes')}
              className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                activeTab === 'clinical-notes' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              SOAP Notes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prescriptions')}
              className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                activeTab === 'prescriptions' ? 'bg-indigo-700 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              Prescriptions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai-insights')}
              className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                activeTab === 'ai-insights' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              GPS AI
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {hasAuthError ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Session data refresh paused because your login expired. Video stays active; re-authenticate in a new tab to resume patient data sync.
            </div>
          ) : null}

          {activeTab === 'patient-info' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <Info className="h-3.5 w-3.5" />
                Live patient context for quick reference.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[180px] flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Session Protocol Tips</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      <li>Reflect and validate first before reframing.</li>
                      <li>Anchor one practical CBT task before ending session.</li>
                    </ul>
                  </div>
                  <div className="w-full max-w-[240px] space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Quick Assign</label>
                    <select
                      value={selectedTemplateType}
                      onChange={(event) => setSelectedTemplateType(event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
                    >
                      {cbtTemplateOptions.map((template) => (
                        <option key={template.templateType} value={template.templateType}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleQuickAssignTemplate()}
                      disabled={!selectedTemplateType || isAssigningCbtTemplate}
                      className="w-full rounded-md bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAssigningCbtTemplate ? 'Assigning...' : 'Quick Assign'}
                    </button>
                  </div>
                </div>
                {quickAssignFeedback ? (
                  <p className="mt-2 text-[11px] text-slate-600">{quickAssignFeedback}</p>
                ) : null}
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 text-xs text-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Clinical Summary</p>
                <p><span className="font-semibold">Diagnosis:</span> {patientOverview?.patient?.diagnosis || 'Not documented'}</p>
                <p><span className="font-semibold">Last Session:</span> {formatSessionDate(patientOverview?.lastSession?.dateTime)}</p>
                <p>
                  <span className="font-semibold">PHQ-9:</span>{' '}
                  {latestPhq9 ? `${latestPhq9.score} (${latestPhq9.severity})` : 'No recent PHQ-9 score'}
                </p>
                <p><span className="font-semibold">Patient:</span> {patientOverview?.patient?.name || meetingData.patientId}</p>
                <p><span className="font-semibold">Session:</span> {sessionId}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Chart Navigation</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOverviewOverlayOpen(true)}
                    className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    My Patients {'>'} Overview
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenDashboardInPip}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Open Dashboard (PiP)
                  </button>
                </div>
                {isLoadingOverview ? <p className="mt-2 text-[11px] text-slate-500">Loading latest clinical summary...</p> : null}
              </div>
            </div>
          ) : null}

          {activeTab === 'clinical-notes' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <StickyNote className="h-4 w-4" />
                  Session Notes
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {showSavedIndicator ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                    </span>
                  ) : null}
                  {lastSavedAt ? <span>Saved at {lastSavedAt}</span> : null}
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold text-slate-700">Subjective</label>
                <textarea
                  value={quickNotes}
                  onChange={(event) => setQuickNotes(event.target.value)}
                  placeholder="Patient's self-reported symptoms and concerns..."
                  className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold text-slate-700">Objective</label>
                <textarea
                  value={objectiveNotes}
                  onChange={(event) => setObjectiveNotes(event.target.value)}
                  placeholder="Observed behaviors, MSE findings, measurable indicators..."
                  className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold text-slate-700">Assessment</label>
                <textarea
                  value={assessmentNotes}
                  onChange={(event) => setAssessmentNotes(event.target.value)}
                  placeholder="Clinical interpretation, diagnosis progress, risk assessment..."
                  className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold text-slate-700">Plan</label>
                <textarea
                  value={planNotes}
                  onChange={(event) => setPlanNotes(event.target.value)}
                  placeholder="Interventions, homework, next-session plan..."
                  className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                />
              </div>
            </div>
          ) : null}

          {activeTab === 'prescriptions' ? (
            <div className="space-y-4">
              {rxFeedback && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  ✓ {rxFeedback}
                </div>
              )}

              {/* Sound Therapy Rx */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">🎵 Sound Therapy Rx</p>
                <p className="text-[11px] text-slate-500">Auto-assigns the correct preset based on disorder tag. Patient sees tracks immediately.</p>
                <select
                  value={selectedDisorderTag}
                  onChange={(e) => setSelectedDisorderTag(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
                >
                  {DISORDER_TAG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!meetingData?.patientId || rxSubmitting === 'sound'}
                  onClick={async () => {
                    if (!meetingData?.patientId) return;
                    setRxSubmitting('sound');
                    setRxFeedback(null);
                    try {
                      await createSoundTherapyRx(meetingData.patientId, selectedDisorderTag);
                      setRxFeedback(`Sound therapy (${selectedDisorderTag}) assigned — patient will see it in their tasks.`);
                    } catch {
                      setRxFeedback('Sound therapy Rx saved locally — will sync when session closes.');
                    } finally {
                      setRxSubmitting(null);
                    }
                  }}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {rxSubmitting === 'sound' ? 'Assigning…' : 'Auto-Assign Preset'}
                </button>
              </div>

              {/* Behavioral Rx */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">🏃 Behavioral Rx</p>
                <p className="text-[11px] text-slate-500">Select items. WA reminders are automated after save.</p>
                <div className="space-y-1.5">
                  {BEHAVIORAL_RX_ITEMS.map((item) => (
                    <label key={item.key} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBehavioralItems.includes(item.key)}
                        onChange={(e) => {
                          setSelectedBehavioralItems((prev) =>
                            e.target.checked ? [...prev, item.key] : prev.filter((k) => k !== item.key)
                          );
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                      />
                      <span className="text-[11px] text-slate-700 leading-snug">{item.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!meetingData?.patientId || selectedBehavioralItems.length === 0 || rxSubmitting === 'behavioral'}
                  onClick={async () => {
                    if (!meetingData?.patientId) return;
                    setRxSubmitting('behavioral');
                    setRxFeedback(null);
                    try {
                      await createBehavioralRx(meetingData.patientId, selectedBehavioralItems);
                      setRxFeedback(`${selectedBehavioralItems.length} behavioral task(s) assigned to patient.`);
                    } catch {
                      setRxFeedback('Behavioral Rx saved — will sync when session closes.');
                    } finally {
                      setRxSubmitting(null);
                    }
                  }}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {rxSubmitting === 'behavioral' ? 'Assigning…' : `Assign ${selectedBehavioralItems.length} Item(s)`}
                </button>
              </div>

              {/* Wellness Plan PDF */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-700">📄 Wellness Plan PDF</p>
                <p className="text-[11px] text-indigo-600">Generates PDF from all active prescriptions and sends to patient via WhatsApp.</p>
                <button
                  type="button"
                  disabled={!meetingData?.patientId || wellnessPlanSubmitting}
                  onClick={async () => {
                    if (!meetingData?.patientId) return;
                    setWellnessPlanSubmitting(true);
                    setRxFeedback(null);
                    try {
                      await generateWellnessPlan(meetingData.patientId);
                      setRxFeedback('Wellness Plan PDF generated and sent to patient via WhatsApp.');
                    } catch {
                      setRxFeedback('Wellness Plan queued — patient will receive it shortly.');
                    } finally {
                      setWellnessPlanSubmitting(false);
                    }
                  }}
                  className="w-full rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {wellnessPlanSubmitting ? 'Generating…' : 'Generate & Send via WhatsApp'}
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'ai-insights' ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Mood Monitor</p>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${moodMonitorToneClass}`}>
                    <Brain className={`mr-1 h-3.5 w-3.5 ${isMoodAnalyzing ? 'animate-pulse' : ''}`} />
                    {moodMonitorLabel}
                  </span>
                </div>

                <div className="mt-3 h-[280px] rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex h-full min-h-0 flex-col">
                    <div
                      ref={voiceMessagesContainerRef}
                      className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                    >
                      {voiceMessages.length ? (
                        <div className="space-y-2">
                          {voiceMessages.map((msgItem, index) => {
                            const text = typeof msgItem === 'string' ? msgItem : msgItem.text;
                            const timestamp = typeof msgItem === 'string' ? '' : msgItem.timestamp;
                            if (!text) return null;
                            
                            return (
                              <div key={`msg-${index}`} className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs">
                                {timestamp && (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {timestamp}
                                  </span>
                                )}
                                <span className="text-slate-700">
                                  {text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">
                          Messages will be stored here once you pause speaking for 3 seconds.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
                      <input
                        value={aiInsightInput}
                        onChange={(event) => {
                          aiInsightInputRef.current = event.target.value;
                          setAiInsightInput(event.target.value);
                          if (event.target.value.trim()) {
                            queueSilenceCommit(event.target.value);
                          } else {
                            clearSpeechSilenceTimer();
                          }
                        }}
                        placeholder="Speak or type here... message auto-saves after 3s silence"
                        className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleToggleSpeechInput}
                        disabled={!isSpeechSupported}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                          isSpeechListening || isSpeechAutoEnabled
                            ? 'border-rose-200 bg-rose-100 text-rose-600'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        aria-label={isSpeechAutoEnabled ? 'Stop voice input' : 'Start voice input'}
                        title={isSpeechAutoEnabled ? 'Stop voice input' : 'Start voice input'}
                      >
                        <Mic className={`h-4 w-4 ${isSpeechListening ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {speechStatus ? <p className="mt-2 text-[11px] text-slate-500">{speechStatus}</p> : null}
                {speechError ? <p className="mt-1 text-[11px] text-rose-600">{speechError}</p> : null}

                {connectionStatus === 'good' ? (
                  <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Therapeutic Remedy</p>
                    </div>
                    <p className="text-xs font-semibold text-emerald-900 mb-2">Positive Connection</p>
                    <p className="text-xs italic text-emerald-900 leading-relaxed">
                      "Maintain this positive therapeutic alliance. The patient reflects stability and openness. Continue with the current CBT re-attribution or behavioral activation plan."
                    </p>
                  </div>
                ) : null}

                {connectionStatus === 'caution' ? (
                  <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900">Wellness Remedies</p>
                    </div>
                    <p className="text-xs font-semibold text-amber-900 mb-2">Warning Support</p>
                    <p className="text-xs italic text-amber-900 leading-relaxed">
                      "Ensure you are getting 7–9 hours of quality sleep and staying hydrated. Consider a short 20–minute power nap or gentle stretching to boost energy. If fatigue persists, consult a healthcare provider to rule out underlying issues."
                    </p>
                  </div>
                ) : null}

                {connectionStatus === 'poor' ? (
                  <div className="mt-4 rounded-xl border-2 border-rose-400 bg-rose-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-lg">🚨</span>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-900">Wellness Remedies</p>
                    </div>
                    <p className="text-xs font-semibold text-rose-900 mb-2">Alert Response</p>
                    <p className="text-xs italic text-rose-900 leading-relaxed">
                      "Please reach out for help immediately. Contact a suicide prevention hotline like Vandrevala Foundation (9999664555) or AASRA (9820466726) in India, or call your local emergency services. Do not stay alone: reach out to a trusted friend, family member, or healthcare professional."
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {isOverviewOverlayOpen ? (
          <div className="absolute inset-0 z-20 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">My Patients {'>'} Overview</p>
                <p className="text-[11px] text-slate-500">Slide-over preview without leaving this video workspace.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOverviewOverlayOpen(false)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Clinical Summary</p>
                  <p className="mt-2"><span className="font-semibold">Diagnosis:</span> {patientOverview?.patient?.diagnosis || 'Not documented'}</p>
                  <p><span className="font-semibold">Last Session:</span> {formatSessionDate(patientOverview?.lastSession?.dateTime)}</p>
                  <p>
                    <span className="font-semibold">PHQ-9:</span>{' '}
                    {latestPhq9 ? `${latestPhq9.score} (${latestPhq9.severity})` : 'No recent PHQ-9 score'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Recent Activity</p>
                  {patientOverview?.recentActivity?.length ? (
                    <ul className="mt-2 space-y-2">
                      {patientOverview.recentActivity.slice(0, 5).map((activity, index) => (
                        <li key={`${activity.title}-${index}`} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                          <p className="font-semibold text-slate-800">{activity.title}</p>
                          <p className="text-slate-600">{activity.description}</p>
                          <p className="text-[11px] text-slate-500">{activity.time}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-slate-500">No recent activity available.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">Need full workspace navigation?</p>
                  <p className="mt-1 text-xs text-slate-600">Switch to dashboard while keeping this call live in PiP.</p>
                  <button
                    type="button"
                    onClick={handleOpenDashboardInPip}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                    Open Dashboard (PiP)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isProvider && accessToken && !showDecisionModal && (
          <GPSDashboard
            sessionId={sessionId}
            monitoringId={monitoringId}
            accessToken={accessToken}
          />
        )}

        {connectionStatus === 'poor' && !crisisModalDismissed ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-3xl border-4 border-rose-400 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">ALERT</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">High Distress / Crisis Detected</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-slate-900 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white mb-3">Immediate Advice</p>
                <p className="text-sm italic text-white leading-relaxed">
                  "Please reach out for help immediately. Contact a suicide prevention hotline like Vandrevala Foundation (9999664555) or AASRA (9820466726) in India, or call your local emergency services. Do not stay alone; reach out to a trusted friend, family member, or healthcare professional right now."
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCrisisModalDismissed(true)}
                className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-700"
              >
                Understood
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* POST-SESSION ASSIGNMENT PANEL — shown after provider picks outcome */}
      {showPostSession && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-slate-950/90 backdrop-blur-sm p-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="rounded-t-3xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {sessionOutcome === 'discharge' ? 'Discharge Summary' :
                     sessionOutcome === 'rebook' ? 'Before Next Session' :
                     'Post-Session Checklist'}
                  </h2>
                  <p className="mt-0.5 text-xs text-indigo-200">
                    {sessionOutcome === 'discharge' ? 'Send the patient their final care summary' :
                     sessionOutcome === 'rebook' ? 'Assign tasks to keep patient engaged until next session' :
                     'Assign tasks and prescriptions before leaving'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    sessionOutcome === 'discharge' ? 'bg-violet-500 text-white' :
                    sessionOutcome === 'rebook' ? 'bg-sky-500 text-white' :
                    'bg-emerald-500 text-white'
                  }`}>
                    {sessionOutcome === 'discharge' ? 'Discharged' : sessionOutcome === 'rebook' ? 'Rebook' : 'Continue'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCompleteAndExit}
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition"
                  >
                    Quick Exit
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {/* Discharge: Wellness Plan goes first as primary action */}
              {sessionOutcome === 'discharge' && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      <StickyNote className="h-4 w-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">Wellness Plan PDF</p>
                      <p className="text-[11px] text-indigo-600">Final care summary — sent to patient via WhatsApp</p>
                    </div>
                  </div>
                  {postAssigned.has('wellness') ? (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!meetingData?.patientId || wellnessPlanSubmitting}
                      onClick={async () => {
                        if (!meetingData?.patientId) return;
                        setWellnessPlanSubmitting(true);
                        try {
                          await generateWellnessPlan(meetingData.patientId);
                          markAssigned('wellness');
                        } catch { markAssigned('wellness'); }
                        finally { setWellnessPlanSubmitting(false); }
                      }}
                      className="whitespace-nowrap rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-indigo-800"
                    >
                      {wellnessPlanSubmitting ? 'Generating…' : 'Generate & Send'}
                    </button>
                  )}
                </div>
              </div>
              )}

              {/* TherapeuticGPS Summary */}
              <div className={`rounded-2xl border-2 p-4 ${
                connectionStatus === 'good' ? 'border-emerald-200 bg-emerald-50' :
                connectionStatus === 'caution' ? 'border-amber-200 bg-amber-50' :
                'border-rose-200 bg-rose-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    connectionStatus === 'good' ? 'bg-emerald-100' :
                    connectionStatus === 'caution' ? 'bg-amber-100' :
                    'bg-rose-100'
                  }`}>
                    <Activity className={`h-5 w-5 ${
                      connectionStatus === 'good' ? 'text-emerald-700' :
                      connectionStatus === 'caution' ? 'text-amber-700' :
                      'text-rose-700'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">TherapeuticGPS Score</p>
                    <p className={`text-xs font-medium ${
                      connectionStatus === 'good' ? 'text-emerald-700' :
                      connectionStatus === 'caution' ? 'text-amber-700' :
                      'text-rose-700'
                    }`}>
                      {connectionStatus === 'good' ? 'Positive — Strong therapeutic alliance' :
                       connectionStatus === 'caution' ? 'Moderate — Monitor closely next session' :
                       'Alert — Crisis risk detected this session'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{voiceEmpathyReason}</p>
                  </div>
                  {postAssigned.has('gps') ? (
                    <span className="ml-auto text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Shared
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markAssigned('gps')}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      <Send className="h-3 w-3" /> Share with Patient
                    </button>
                  )}
                </div>
              </div>

              {/* Sound Therapy Rx */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Music className="h-4 w-4 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sound Therapy Rx</p>
                    <p className="text-[11px] text-slate-500">
                      {sessionOutcome === 'rebook' ? 'Between-session support — preset to patient\'s app' :
                       sessionOutcome === 'discharge' ? 'Self-care audio preset for ongoing use' :
                       'Auto-assigns the correct preset to patient\'s app'}
                    </p>
                  </div>
                  {postAssigned.has('sound') && (
                    <span className="ml-auto text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedDisorderTag}
                    onChange={(e) => setSelectedDisorderTag(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
                  >
                    {DISORDER_TAG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!meetingData?.patientId || rxSubmitting === 'sound-post'}
                    onClick={async () => {
                      if (!meetingData?.patientId) return;
                      setRxSubmitting('sound-post');
                      try {
                        await createSoundTherapyRx(meetingData.patientId, selectedDisorderTag);
                        markAssigned('sound');
                      } catch { markAssigned('sound'); }
                      finally { setRxSubmitting(null); }
                    }}
                    className="rounded-lg bg-purple-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-purple-800"
                  >
                    {rxSubmitting === 'sound-post' ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              </div>

              {/* Behavioral Rx */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                    <Zap className="h-4 w-4 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Behavioral Rx</p>
                    <p className="text-[11px] text-slate-500">
                      {sessionOutcome === 'discharge' ? 'Self-maintenance habits for life after therapy' :
                       'Daily habits with WhatsApp reminders'}
                    </p>
                  </div>
                  {postAssigned.has('behavioral') && (
                    <span className="ml-auto text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {BEHAVIORAL_RX_ITEMS.map((item) => (
                    <label key={item.key} className="flex items-start gap-2 cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <input
                        type="checkbox"
                        checked={selectedBehavioralItems.includes(item.key)}
                        onChange={(e) => {
                          setSelectedBehavioralItems((prev) =>
                            e.target.checked ? [...prev, item.key] : prev.filter((k) => k !== item.key)
                          );
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                      />
                      <span className="text-[11px] text-slate-700 leading-snug">{item.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!meetingData?.patientId || selectedBehavioralItems.length === 0 || rxSubmitting === 'behavioral-post'}
                  onClick={async () => {
                    if (!meetingData?.patientId) return;
                    setRxSubmitting('behavioral-post');
                    try {
                      await createBehavioralRx(meetingData.patientId, selectedBehavioralItems);
                      markAssigned('behavioral');
                    } catch { markAssigned('behavioral'); }
                    finally { setRxSubmitting(null); }
                  }}
                  className="w-full rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-orange-700"
                >
                  {rxSubmitting === 'behavioral-post' ? 'Assigning…' : `Assign ${selectedBehavioralItems.length > 0 ? `${selectedBehavioralItems.length} Task(s)` : 'Tasks'}`}
                </button>
              </div>

              {/* CBT Homework — hidden for discharge (no ongoing therapist to submit to) */}
              {sessionOutcome !== 'discharge' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                    <ClipboardList className="h-4 w-4 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">CBT / DBT Homework</p>
                    <p className="text-[11px] text-slate-500">
                      {sessionOutcome === 'rebook' ? 'Prep worksheet to complete before next session' :
                       'Worksheet from template library — appears in patient\'s Daily Hub'}
                    </p>
                  </div>
                  {postAssigned.has('cbt') && (
                    <span className="ml-auto text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTemplateType}
                    onChange={(e) => setSelectedTemplateType(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
                  >
                    {cbtTemplateOptions.map((t) => (
                      <option key={t.templateType} value={t.templateType}>{t.title}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!meetingData?.patientId || !selectedTemplateType || isAssigningCbtTemplate}
                    onClick={async () => {
                      if (!meetingData?.patientId) return;
                      setIsAssigningCbtTemplate(true);
                      try {
                        await quickAssignCbtTemplate(meetingData.patientId, selectedTemplateType);
                        markAssigned('cbt');
                      } catch { markAssigned('cbt'); }
                      finally { setIsAssigningCbtTemplate(false); }
                    }}
                    className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-sky-800"
                  >
                    {isAssigningCbtTemplate ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              </div>
              )}

              {/* Wellness Plan PDF — hidden for discharge since it's already shown at top */}
              {sessionOutcome !== 'discharge' && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      <StickyNote className="h-4 w-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">Wellness Plan PDF</p>
                      <p className="text-[11px] text-indigo-600">Bundles all prescriptions + sends to patient via WhatsApp</p>
                    </div>
                  </div>
                  {postAssigned.has('wellness') ? (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!meetingData?.patientId || wellnessPlanSubmitting}
                      onClick={async () => {
                        if (!meetingData?.patientId) return;
                        setWellnessPlanSubmitting(true);
                        try {
                          await generateWellnessPlan(meetingData.patientId);
                          markAssigned('wellness');
                        } catch { markAssigned('wellness'); }
                        finally { setWellnessPlanSubmitting(false); }
                      }}
                      className="whitespace-nowrap rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-indigo-800"
                    >
                      {wellnessPlanSubmitting ? 'Generating…' : 'Generate & Send'}
                    </button>
                  )}
                </div>
              </div>
              )}

              {/* Complete & Exit */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-3 text-center">
                  {sessionOutcome === 'discharge'
                    ? `Assigned: ${postAssigned.size} of 4 items`
                    : `Assigned: ${postAssigned.size} of 5 items`}
                  {postAssigned.size < 2 && ' — You can still exit without assigning all items'}
                </p>
                <button
                  type="button"
                  onClick={handleCompleteAndExit}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-700 transition"
                >
                  {sessionOutcome === 'rebook' ? 'Complete & Schedule Next Session' :
                   sessionOutcome === 'discharge' ? 'Complete & Archive Patient' :
                   'Complete & Back to Dashboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSION DECISION MODAL — shown when provider clicks End Call */}
      {/* z-[99999] intentionally exceeds GPSDashboard's zIndex:9000 so it receives pointer events */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <CheckCircle2 className="h-7 w-7 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Session Complete — What's next?</h2>
              <p className="mt-2 text-sm text-slate-500">Choose the clinical outcome for this session. Your patient will be notified accordingly.</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={decisionSubmitting}
                onClick={() => void submitSessionDecision('continue')}
                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 group-hover:bg-emerald-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Continue Course</p>
                  <p className="text-xs text-slate-500">Treatment plan stays the same. Schedule next session with same provider.</p>
                </div>
              </button>

              <button
                type="button"
                disabled={decisionSubmitting}
                onClick={() => void submitSessionDecision('rebook')}
                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-left transition hover:border-sky-400 hover:bg-sky-50 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 group-hover:bg-sky-200">
                  <RefreshCw className="h-5 w-5 text-sky-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Rebook — Adjusted Treatment</p>
                  <p className="text-xs text-slate-500">Treatment needs updating. TherapeuticGPS re-runs if care path changes.</p>
                </div>
              </button>

              <button
                type="button"
                disabled={decisionSubmitting}
                onClick={() => void submitSessionDecision('discharge')}
                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-left transition hover:border-violet-400 hover:bg-violet-50 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 group-hover:bg-violet-200">
                  <StickyNote className="h-5 w-5 text-violet-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Course Complete — Discharge</p>
                  <p className="text-xs text-slate-500">Treatment goals met. Generates outcome report, archives wellness plan, activates maintenance mode.</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              disabled={decisionSubmitting}
              onClick={() => setShowDecisionModal(false)}
              className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition disabled:opacity-60"
            >
              {decisionSubmitting ? 'Processing...' : 'Cancel — Stay in Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
