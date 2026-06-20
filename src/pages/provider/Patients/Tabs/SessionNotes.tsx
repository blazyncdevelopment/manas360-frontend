import { Calendar, Clock3, FileText, Lock, Plus, Sparkles, MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../context/AuthContext';
import { useCreatePatientNote, usePatientNotes, useUpdatePatientNote } from '../../../../hooks/usePatientNotes';
import { getPatientCbtAssignments, optimizeNoteText } from '../../../../api/provider';
import type { NoteData, NoteStatus } from '../../../../api/provider';
import { deliverPrescription } from '../../../../api/mdcPrescriptionHomework.api';

const statusBadgeClass = (status: NoteStatus) => {
  if (status === 'Signed') {
    return 'bg-[#E8EFE6] text-[#4A6741]';
  }
  return 'bg-amber-50 text-amber-700';
};

const sessionTypeOptions = ['CBT Follow-up', 'Behavioral Activation Review', 'Medication Check-in', 'Intake Review'];

const todayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const durationToMinutes = (value: string): string => {
  const parsed = Number.parseInt(String(value || '').replace(/[^0-9]/g, ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return '50';
  return String(parsed);
};

export default function SessionNotes() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();

  const { data: notes = [], isLoading } = usePatientNotes(patientId);

  const { data: cbtAssignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ['patient-cbt-assignments', patientId],
    queryFn: () => getPatientCbtAssignments(patientId!),
    enabled: !!patientId,
  });

  const createNoteMutation = useCreatePatientNote();
  const updateNoteMutation = useUpdatePatientNote();

  const providerName = useMemo(() => {
    const full = `${String(user?.firstName || '').trim()} ${String(user?.lastName || '').trim()}`.trim();
    return full || user?.email || 'Provider';
  }, [user?.email, user?.firstName, user?.lastName]);

  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState(todayIsoDate());
  const [sessionType, setSessionType] = useState(sessionTypeOptions[0]);
  const [duration, setDuration] = useState('50');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  const selectedNote: NoteData | null = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((note) => note.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const [loadedPatientId, setLoadedPatientId] = useState<string | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; title: string } | null>(null);
  const [templateInstruction, setTemplateInstruction] = useState('');
  const [isAssigningTemplate, setIsAssigningTemplate] = useState(false);
  const [diagnosisCodes, setDiagnosisCodes] = useState('');
  const [notifyViaWhatsApp, setNotifyViaWhatsApp] = useState(true);
  const [whatsappTemplate, setWhatsappTemplate] = useState('Hi! I have assigned a new activity for you. Please check your Manas360 dashboard to complete it before our next session.');

  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isReferring, setIsReferring] = useState(false);
  const [selectedPsychiatrist, setSelectedPsychiatrist] = useState('Dr. Shruti');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [referralMessageTemplate, setReferralMessageTemplate] = useState('Hi! Your care provider has referred you to Dr. Patel for a medical evaluation. Please check your Manas360 app for next steps.');

  const handleGenerateReferral = async () => {
    setIsReferring(true);
    try {
      // Simulate backend referral creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Notify via WhatsApp
      await deliverPrescription('mock-referral-id', 'whatsapp');
      toast.success(`Referral sent to ${selectedPsychiatrist} and patient notified via WhatsApp! 📱`);
      setIsReferralModalOpen(false);
    } catch (err) {
      toast.error('Failed to generate referral.');
    } finally {
      setIsReferring(false);
    }
  };

  const handleAssignTemplate = async (templateId: string, title: string) => {
    if (!patientId) return;
    setIsAssigningTemplate(true);
    try {
      const { assignPatientItem } = await import('../../../../api/provider');
      await assignPatientItem(patientId, {
        assignmentType: 'CBT',
        templateId,
        title,
        instructions: templateInstruction,
      });
      toast.success(`${title} assigned successfully.`);
      refetchAssignments();
      if (notifyViaWhatsApp) {
        toast.success('Patient notified via WhatsApp! 📱');
      }
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      setTemplateInstruction('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to assign template.');
    } finally {
      setIsAssigningTemplate(false);
    }
  };

  useEffect(() => {
    if (patientId && !isLoading) {
      if (loadedPatientId !== patientId) {
        setLoadedPatientId(patientId);
        if (notes.length) {
          setSelectedNoteId(notes[0].id);
        } else {
          setSelectedNoteId('');
        }
      }
    }
  }, [patientId, isLoading, notes, loadedPatientId]);

  useEffect(() => {
    if (!isLoading && selectedNoteId && !notes.some((n) => n.id === selectedNoteId)) {
      if (notes.length) {
        setSelectedNoteId(notes[0].id);
      } else {
        setSelectedNoteId('');
      }
    }
  }, [notes, selectedNoteId, isLoading]);

  useEffect(() => {
    if (!selectedNote) {
      return;
    }
    setSessionDate(selectedNote.sessionDate.slice(0, 10));
    setSessionType(selectedNote.sessionType || sessionTypeOptions[0]);
    setDuration(durationToMinutes(selectedNote.duration));
    setSubjective(selectedNote.subjective || '');
    setObjective(selectedNote.objective || '');
    setAssessment(selectedNote.assessment || '');
    setDiagnosisCodes(selectedNote.diagnosisCodes || '');
    setPlan(selectedNote.plan || '');
  }, [selectedNote]);

  const resetEditorForNew = () => {
    setSelectedNoteId('');
    setSessionDate(todayIsoDate());
    setSessionType(sessionTypeOptions[0]);
    setDuration('50');
    setSubjective('');
    setObjective('');
    setAssessment('');
    setDiagnosisCodes('');
    setPlan('');
  };

  const saveNote = async (status: NoteStatus) => {
    if (!patientId) return;

    const noteData = {
      subjective,
      objective,
      assessment,
      diagnosisCodes,
      plan,
      sessionDate,
      sessionType,
      duration,
      status,
    };

    const isEditingDraft = Boolean(selectedNote && selectedNote.status === 'Draft');

    if (isEditingDraft && selectedNote) {
      const result = await updateNoteMutation.mutateAsync({
        patientId,
        noteId: selectedNote.id,
        noteData,
      });
      setSelectedNoteId(result.id);
      if (status === 'Signed') {
        toast.success('Note signed and locked successfully 🔒');
      }
      return;
    }

    const result = await createNoteMutation.mutateAsync({
      patientId,
      noteData,
    });

    setSelectedNoteId(result.id);
    if (status === 'Signed') {
      toast.success('Note signed and locked successfully 🔒');
    }
  };

  const isSigned = selectedNote?.status === 'Signed';
  const isSaving = createNoteMutation.isPending || updateNoteMutation.isPending;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <aside className="lg:col-span-1">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] pb-4">
            <div>
              <p className="font-display text-lg font-semibold text-[#2D4128]">Session Notes</p>
              <p className="text-sm text-slate-500">Patient ID {patientId || '123'}</p>
            </div>
            <button
              type="button"
              onClick={resetEditorForNew}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4A6741] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#2D4128]"
            >
              <Plus className="h-4 w-4" />
              New Note +
            </button>
          </div>

          <div className="mt-4 max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {isLoading && Array.from({ length: 5 }).map((_, idx) => (
              <div key={`note-skeleton-${idx}`} className="animate-pulse rounded-xl border border-[#E5E5E5] px-4 py-4">
                <div className="h-3 w-28 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-36 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
              </div>
            ))}

            {!isLoading && notes.map((note) => {
              const isActive = note.id === selectedNoteId;

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full rounded-xl border px-4 py-4 text-left transition-all ${isActive
                    ? 'border-[#E5E5E5] border-l-4 border-l-[#4A6741] bg-[#E8EFE6]'
                    : 'border-[#E5E5E5] bg-white hover:bg-[#FAFAF8]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-[#2D4128]">{note.date || 'Unscheduled'}</p>
                      <p className="mt-1 text-sm text-slate-600">{note.providerName}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(note.status)}`}>
                      {note.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <FileText className="h-4 w-4" />
                    {note.sessionType}
                  </div>
                </button>
              );
            })}

            {!isLoading && notes.length === 0 && (
              <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-4 text-sm text-slate-600">
                No notes available yet. Start with a new note.
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t border-[#E5E5E5] pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Patient Exercises</p>
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm font-semibold text-[#2D4128] transition hover:bg-[#FAFAF8]"
            >
              <Sparkles className="h-4 w-4" />
              Assign CBT Template
            </button>
            <div className="mt-4 space-y-2">
              {cbtAssignments.slice(0, 5).map((assign: any) => (
                <div key={assign.id} className="rounded-lg border border-[#E5E5E5] bg-[#FAFAF8] p-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm text-[#2D4128]">{assign.templateType.replace('_', ' ')}</p>
                    <span className="text-[10px] font-semibold text-slate-500">{new Date(assign.createdAt).toLocaleDateString()}</span>
                  </div>
                  {assign.description && (
                    <p className="mt-1 text-xs text-slate-500 truncate">{assign.description}</p>
                  )}
                  <span className="mt-2 inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {assign.status}
                  </span>
                </div>
              ))}
              {cbtAssignments.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">No exercises assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:col-span-2">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E5E5E5] pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold text-[#2D4128]">SOAP Note Editor</p>
              <p className="mt-1 text-sm text-slate-500">Reference prior notes while documenting the current session.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Calendar className="h-4 w-4" />
                  Date
                </span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(event) => setSessionDate(event.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D4128] outline-none focus:border-[#4A6741] focus:bg-[#FAFAF8] focus:ring-2 focus:ring-[#4A6741]/10"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <FileText className="h-4 w-4" />
                  Session Type
                </span>
                <select
                  value={sessionType}
                  onChange={(event) => setSessionType(event.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D4128] outline-none focus:border-[#4A6741] focus:bg-[#FAFAF8] focus:ring-2 focus:ring-[#4A6741]/10"
                >
                  {sessionTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Duration
                </span>
                <input
                  type="text"
                  value={duration}
                  onChange={(event) => setDuration(durationToMinutes(event.target.value))}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D4128] outline-none focus:border-[#4A6741] focus:bg-[#FAFAF8] focus:ring-2 focus:ring-[#4A6741]/10"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <SoapTextarea
              label="Subjective"
              placeholder="Patient's self-reported symptoms, feelings, and experiences..."
              value={subjective}
              onChange={setSubjective}
              disabled={isSigned}
            />
            <SoapTextarea
              label="Objective"
              placeholder="Provider's observations, MSE, PHQ-9 scores..."
              value={objective}
              onChange={setObjective}
              disabled={isSigned}
            />
            <SoapTextarea
              label="Assessment"
              placeholder="Clinical synthesis, diagnosis progress, risk evaluation..."
              value={assessment}
              onChange={setAssessment}
              disabled={isSigned}
            />
            <SoapTextarea
              label="Diagnosis Codes (e.g. ICD-10/DSM-5)"
              placeholder="Enter diagnosis codes (e.g., F32.1, F41.1)..."
              value={diagnosisCodes}
              onChange={setDiagnosisCodes}
              disabled={isSigned}
            />
            <SoapTextarea
              label="Plan"
              placeholder="Next steps, homework assigned, medication changes..."
              value={plan}
              onChange={setPlan}
              disabled={isSigned}
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#E5E5E5] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsReferralModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2D4128] text-[#2D4128] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#FAFAF8]"
            >
              Generate Referral
            </button>
            <button
              type="button"
              onClick={() => void saveNote('Draft')}
              disabled={isSaving || isSigned}
              className="inline-flex items-center justify-center rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-semibold text-[#2D4128] transition hover:bg-[#FAFAF8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => void saveNote('Signed')}
              disabled={isSaving || isSigned}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2D4128] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              Sign & Lock Note
            </button>
          </div>

          {(createNoteMutation.isError || updateNoteMutation.isError) && (
            <p className="mt-3 text-sm text-red-600">We could not save this note. Please try again.</p>
          )}
          {!createNoteMutation.isError && selectedNote && isSigned && (
            <p className="mt-3 text-sm text-[#4A6741]">This signed note is read-only for clinical governance.</p>
          )}
          {!selectedNote && (
            <p className="mt-3 text-sm text-slate-500">Creating a new note as {providerName}.</p>
          )}
        </div>
      </section>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-md bg-white shadow-2xl p-6 flex flex-col overflow-y-auto transform transition-transform duration-300">
            <h3 className="mb-1 font-display text-xl font-bold text-[#2D4128]">Assign CBT / Session Template</h3>
            <p className="mb-5 text-sm text-slate-500">Select a pre-built template to assign to the patient.</p>

            <div className="space-y-3">
              {[
                { id: 'THOUGHT_RECORD', title: 'Thought Record Template', icon: '📝', desc: 'Classic 7-column CBT thought record.' },
                { id: 'EXPOSURE_HIERARCHY', title: 'Exposure Hierarchy', icon: '📊', desc: 'Graduated exposure with SUDS ratings.' },
                { id: 'HOMEWORK', title: 'Homework Assignments', icon: '🏠', desc: 'Mood diary, activity scheduling, etc.' },
                { id: 'SESSION_GUIDE', title: 'Session Structure Guide', icon: '📋', desc: 'Patient-facing 50-min session overview.' },
              ].map((tmpl) => (
                <div key={tmpl.id} className="space-y-2">
                  <button
                    onClick={() => {
                      if (selectedTemplate?.id === tmpl.id) {
                        setSelectedTemplate(null);
                      } else {
                        setSelectedTemplate({ id: tmpl.id, title: tmpl.title });
                      }
                    }}
                    disabled={isAssigningTemplate}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${selectedTemplate?.id === tmpl.id ? 'border-[#4A6741] bg-[#FAFAF8] ring-1 ring-[#4A6741]' : 'border-[#E5E5E5] bg-white hover:border-[#4A6741] hover:bg-[#FAFAF8]'} disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <div>
                        <p className="font-semibold text-[#2D4128]">{tmpl.title}</p>
                        <p className="text-xs text-slate-500">{tmpl.desc}</p>
                      </div>
                    </div>
                  </button>

                  {selectedTemplate?.id === tmpl.id && (
                    <div className="p-3 bg-slate-50 border border-[#E5E5E5] rounded-xl">
                      <label className="block text-xs font-semibold text-[#2D4128] uppercase mb-1">Additional Instructions / Data</label>
                      <textarea
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#4A6741]"
                        rows={3}
                        value={templateInstruction}
                        onChange={(e) => setTemplateInstruction(e.target.value)}
                        placeholder="Enter custom instructions or data for this assignment..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-[#E5E5E5] bg-slate-50 p-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-[#2D4128] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" /> Notify via WhatsApp (Always On)
                </p>
                <textarea
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D4128] outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                  rows={3}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-auto pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setSelectedTemplate(null);
                  setTemplateInstruction('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedTemplate || isAssigningTemplate}
                onClick={() => handleAssignTemplate(selectedTemplate!.id, selectedTemplate!.title)}
                className="rounded-lg bg-[#4A6741] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D4128] disabled:opacity-50"
              >
                {isAssigningTemplate ? 'Assigning...' : 'Assign Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isReferralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 font-display text-xl font-bold text-[#2D4128]">Refer to Psychiatrist</h3>
            <p className="mb-5 text-sm text-slate-500">Securely forward patient notes for a medical evaluation.</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#2D4128]">Select Psychiatrist</label>
                <select
                  value={selectedPsychiatrist}
                  onChange={(e) => {
                    setSelectedPsychiatrist(e.target.value);
                    setReferralMessageTemplate(`Hi! Your care provider has referred you to ${e.target.value} for a medical evaluation. Please check your Manas360 app for next steps.`);
                  }}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D4128] outline-none focus:border-[#4A6741] focus:ring-2 focus:ring-[#4A6741]/10"
                >
                  <option value="Dr. Shruti">Dr. Shruti</option>
                  <option value="Dr. Patel">Dr. Patel</option>
                  <option value="Dr. Smith">Dr. Smith</option>
                </select>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-[#E5E5E5] p-3 transition hover:bg-[#FAFAF8]">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#4A6741]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#2D4128]">Include Assessment & Notes</p>
                  <p className="text-xs text-slate-500">Patient consent required to share clinical documentation.</p>
                </div>
              </label>

              <div className="mt-5 rounded-lg border border-[#E5E5E5] bg-slate-50 p-4">
                <label className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    checked={notifyViaWhatsApp} 
                    onChange={(e) => setNotifyViaWhatsApp(e.target.checked)} 
                    className="h-4 w-4 accent-[#25D366]"
                  />
                  <span className="text-sm font-semibold text-[#2D4128] flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" /> Notify Patient via WhatsApp
                  </span>
                </label>
                {notifyViaWhatsApp && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp Message Template</p>
                    <textarea
                      className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D4128] outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                      rows={3}
                      value={referralMessageTemplate}
                      onChange={(e) => setReferralMessageTemplate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateReferral}
                disabled={isReferring}
                className="rounded-lg bg-[#4A6741] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D4128] disabled:opacity-50"
              >
                {isReferring ? 'Sending...' : 'Send Referral'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type SoapTextareaProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function SoapTextarea({ label, placeholder, value, onChange, disabled = false }: SoapTextareaProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!value.trim()) return;
    setIsOptimizing(true);
    try {
      const optimized = await optimizeNoteText(value, label);
      onChange(optimized);
      toast.success(`${label} optimized successfully! ✨`);
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Failed to optimize text.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-base font-semibold text-[#2D4128]">{label}</span>
        <button
          type="button"
          onClick={handleOptimize}
          disabled={disabled || isOptimizing || !value.trim()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A6741] hover:text-[#2D4128] disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Optimize with Claude AI"
        >
          {isOptimizing ? (
            <span className="animate-pulse flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Optimizing...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Optimize with AI
            </span>
          )}
        </button>
      </div>
      <textarea
        rows={5}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#2D4128] outline-none transition focus:border-[#4A6741] focus:bg-[#FAFAF8] focus:ring-2 focus:ring-[#4A6741]/10 disabled:cursor-not-allowed disabled:bg-[#FAFAF8] disabled:text-slate-500"
      />
    </label>
  );
}
