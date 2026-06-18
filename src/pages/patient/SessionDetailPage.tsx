import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionDetail } from '../../hooks/useSessionDetail';
import { Calendar, Clock, Download, ChevronLeft, User, Stethoscope, FileText, CheckCircle } from 'lucide-react';
import { patientApi } from '../../api/patient';
import toast from 'react-hot-toast';

const PatientSessionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSessionDetail(id);

  if (isLoading) return <div className="p-8 text-center text-charcoal/60">Loading session details...</div>;
  if (isError || !data) return <div className="p-8 text-center text-red-500">Failed to load session details</div>;

  // For patient, data is flat object
  const session = data;

  const handleDownloadReport = async () => {
    try {
      if (!session.id) return;
      const blob = await patientApi.downloadSessionPdf(session.id);
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Session_Report_${session.booking_reference || session.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (e) {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-sm font-medium text-calm-sage hover:text-calm-sage/80 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Reports
      </button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Session Summary</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-charcoal/70">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {session.duration_minutes} min
            </div>
            <span className="inline-flex items-center rounded-full bg-calm-sage/10 px-2.5 py-0.5 text-xs font-medium text-calm-sage">
              {session.status?.toUpperCase() || 'COMPLETED'}
            </span>
          </div>
        </div>
        
        {session.documents?.session_pdf_available && (
          <button 
            onClick={handleDownloadReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-calm-sage px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-calm-sage/90"
          >
            <Download className="h-4 w-4" />
            Download PDF Report
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Provider Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-calm-sage/20 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-charcoal/50">Provider Info</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-calm-sage/10 text-calm-sage">
                {session.provider?.role === 'psychiatrist' ? <Stethoscope className="h-6 w-6" /> : <User className="h-6 w-6" />}
              </div>
              <div>
                <div className="font-medium text-charcoal">{session.provider?.name || 'Your Provider'}</div>
                <div className="text-sm text-charcoal/60 capitalize">{session.provider?.role || 'Therapist'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-calm-sage/20 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-charcoal/50">Next Steps</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-charcoal/80">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-calm-sage" />
                Review session notes and recommendations
              </li>
              <li className="flex items-start gap-2.5 text-sm text-charcoal/80">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-calm-sage" />
                Continue prescribed activities
              </li>
              <li className="flex items-start gap-2.5 text-sm text-charcoal/80">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-calm-sage" />
                Book your next follow-up session
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Notes / Suggestions */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-calm-sage/20 bg-white p-6 shadow-sm min-h-[400px]">
            <div className="mb-6 flex items-center gap-2 border-b border-calm-sage/10 pb-4">
              <FileText className="h-5 w-5 text-calm-sage" />
              <h2 className="text-xl font-semibold text-charcoal">Provider's Suggestions & Notes</h2>
            </div>
            
            {session.notes?.available && session.notes?.content ? (
              <div className="prose prose-sm sm:prose-base prose-sage max-w-none text-charcoal/80 whitespace-pre-wrap">
                {session.notes.content}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center text-charcoal/50">
                <FileText className="mb-2 h-8 w-8 opacity-20" />
                <p>No notes or suggestions available for this session yet.</p>
                <p className="text-sm mt-1">Your provider might still be finalizing them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSessionDetailPage;
