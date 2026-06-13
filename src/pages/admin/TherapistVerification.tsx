import { useState, useEffect, useCallback } from 'react';
import {
  getAdminVerifications,
  getAdminVerificationReview,
  updateAdminVerification,
  type AdminUser,
  type AdminProviderOnboardingProfile,
  type AdminVerificationDocument,
} from '../../api/admin.api';
import ProviderOnboardingReviewPanel from '../../components/admin/ProviderOnboardingReviewPanel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  THERAPIST: { label: 'Therapist', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  PSYCHOLOGIST: { label: 'Psychologist', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  PSYCHIATRIST: { label: 'Psychiatrist', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  COACH: { label: 'Coach', color: 'bg-amber-50 text-amber-700 border-amber-100' },
};

export default function TherapistVerification() {
  const [verifications, setVerifications] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AdminProviderOnboardingProfile | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<AdminVerificationDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocLoading, setIsDocLoading] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminVerifications(showAll);
      setVerifications(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const closeReviewModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedProfile(null);
    setSelectedDocs([]);
  };

  const handleViewDocs = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedProfile(null);
    setSelectedDocs([]);
    setIsModalOpen(true);
    setIsDocLoading(true);
    try {
      const res = await getAdminVerificationReview(user.id, user);
      setSelectedProfile(res.data.profile);
      setSelectedDocs(res.data.documents || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load provider submission');
      closeReviewModal();
    } finally {
      setIsDocLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      reason = prompt('Enter rejection reason:') || undefined;
      if (!reason) return;
    }

    try {
      await updateAdminVerification(userId, action, reason);
      toast.success(`Therapist ${action === 'approve' ? 'approved' : 'rejected'}`);
      if (selectedUser?.id === userId) {
        closeReviewModal();
      }
      fetchVerifications();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const selectedTherapistName = selectedUser
    ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
    : '';

  if (loading) return <div className="p-8 text-center text-gray-500 italic">Synchronizing verification queue...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Verification</h1>
          <p className="text-sm text-gray-600 mt-1 font-semibold">Review and approve clinical credentials for all provider types (Therapist, Psychologist, Psychiatrist, Coach).</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${showAll ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {showAll ? 'Showing All' : 'Show All Providers'}
          </button>
          <Badge variant="soft" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50">
            Clinical Gatekeeper
          </Badge>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-base uppercase tracking-wider">Pending Credentials Queue</h3>
          <Badge variant="secondary" className="text-[10px] font-black">{verifications.length} Pending</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold uppercase text-gray-600 tracking-wider">
                <th className="px-6 py-4">Provider Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Joined Portal</th>
                <th className="px-6 py-4 text-center">Credentials</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-emerald-600 font-bold italic">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">✅</span>
                      All caught up! No pending verifications.
                    </div>
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{v.firstName} {v.lastName}</div>
                      <div className="font-mono font-black text-gray-500 text-[10px]">ID:{v.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      <div className="font-medium">{v.email || '—'}</div>
                      <div className="text-xs text-gray-600 font-medium">{(v as AdminUser & { phone?: string }).phone || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const roleKey = String((v as AdminUser & { role?: string }).role || 'THERAPIST').toUpperCase();
                        const meta = ROLE_LABELS[roleKey] || ROLE_LABELS.THERAPIST;
                        return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.color}`}>{meta.label}</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={(v as AdminUser & { isTherapistVerified?: boolean }).isTherapistVerified ? 'success' : 'warning'} className="text-[10px] font-black uppercase tracking-wider">
                        {(v as AdminUser & { isTherapistVerified?: boolean }).isTherapistVerified ? 'VERIFIED' : v.onboardingStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-xs font-bold">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => void handleViewDocs(v)}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        Review Docs
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAction(v.id, 'approve')}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors whitespace-nowrap shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAction(v.id, 'reject')}
                          className="inline-flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-600 transition-colors whitespace-nowrap"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeReviewModal}
        title={`7-Step Application: ${selectedTherapistName}`}
        size="xl"
      >
        {isDocLoading ? (
          <div className="py-20 text-center text-gray-400 italic font-medium">Loading provider submission…</div>
        ) : (
          <ProviderOnboardingReviewPanel profile={selectedProfile} documents={selectedDocs} />
        )}
      </Modal>

      <p className="text-[10px] text-gray-500 mt-12 text-center uppercase font-bold tracking-widest font-mono">
        Clinical Gatekeeper Protocol • API: Admin.v1 • HIPAA/DPDPA Governance Node
      </p>
    </div>
  );
}
