import { Plus, Sparkles, MessageCircle, FileText, X, Clock3 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { getPatientCbtAssignments } from '../../../../api/provider';

export default function PatientExercises() {
  const { patientId } = useParams<{ patientId: string }>();

  const { data: cbtAssignments = [], refetch: refetchAssignments, isLoading } = useQuery({
    queryKey: ['patient-cbt-assignments', patientId],
    queryFn: () => getPatientCbtAssignments(patientId!),
    enabled: !!patientId,
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; title: string } | null>(null);
  const [templateInstruction, setTemplateInstruction] = useState('');
  const [isAssigningTemplate, setIsAssigningTemplate] = useState(false);
  const notifyViaWhatsApp = true;
  const [whatsappTemplate, setWhatsappTemplate] = useState('Hi! I have assigned a new activity for you. Please check your Manas360 dashboard to complete it before our next session.');

  const [viewedAssignment, setViewedAssignment] = useState<any>(null);

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

  const renderAssignmentContent = (content: any) => {
    if (!content || typeof content !== 'object') return <p className="text-sm text-slate-500">No data available.</p>;
    
    return (
      <div className="space-y-4">
        {Object.entries(content).map(([key, value]) => {
          if (key === 'description') return null; // Skip description if it's just meta
          
          let displayValue = String(value);
          if (Array.isArray(value)) {
            displayValue = value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
          } else if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value);
          }

          return (
            <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-sm text-[#2D4128]">{displayValue}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#2D4128]">Patient Exercises & CBT</h2>
          <p className="mt-1 text-sm text-slate-500">Manage therapy homework, exposure hierarchies, and thought records.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4A6741] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D4128]"
        >
          <Plus className="h-4 w-4" />
          Assign Exercise
        </button>
      </div>

      <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 w-full rounded-xl bg-slate-100"></div>
            <div className="h-24 w-full rounded-xl bg-slate-100"></div>
          </div>
        ) : cbtAssignments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cbtAssignments.map((assign: any) => (
              <div key={assign.id} className="flex flex-col rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-4 transition hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#4A6741]" />
                    <p className="font-semibold text-[#2D4128]">{assign.templateType.replace('_', ' ')}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${assign.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {assign.status}
                  </span>
                </div>
                
                {assign.description && (
                  <p className="mb-4 text-sm text-slate-600 line-clamp-2 flex-grow">{assign.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-[#E5E5E5] pt-3">
                  <p className="text-xs text-slate-500">{new Date(assign.createdAt).toLocaleDateString()}</p>
                  <button
                    onClick={() => setViewedAssignment(assign)}
                    className="text-sm font-semibold text-[#4A6741] hover:underline"
                  >
                    {assign.status === 'COMPLETED' ? 'View Details' : 'View Meta'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f5ee] text-[#4A6741]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D4128]">No Exercises Assigned</h3>
            <p className="mt-1 text-sm text-slate-500">Assign a CBT template or homework to track patient progress.</p>
          </div>
        )}
      </div>

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

      {viewedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] p-5">
              <div>
                <h3 className="font-display text-xl font-bold text-[#2D4128]">{viewedAssignment.templateType.replace('_', ' ')}</h3>
                <p className="text-sm text-slate-500">Status: {viewedAssignment.status} • Assigned: {new Date(viewedAssignment.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setViewedAssignment(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-grow">
              {viewedAssignment.status === 'COMPLETED' ? (
                <>
                  <h4 className="font-semibold text-[#2D4128] mb-4">Patient's Response</h4>
                  {renderAssignmentContent(viewedAssignment.content)}
                </>
              ) : (
                <div className="text-center py-8">
                  <Clock3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-[#2D4128]">Pending Completion</h4>
                  <p className="text-sm text-slate-500 mt-1">The patient has not completed this assignment yet.</p>
                  
                  {viewedAssignment.description && (
                    <div className="mt-6 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your Instructions</p>
                      <p className="text-sm text-[#2D4128]">{viewedAssignment.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-[#E5E5E5] p-4 flex justify-end">
              <button
                onClick={() => setViewedAssignment(null)}
                className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
