import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Download,
  AlertCircle,
  ChevronRight,
  RefreshCcw,
  Loader2,
  Lock,
} from 'lucide-react';
import { useEnrollmentStore } from '../../store/CertificationEnrollmentStore';
import { CERTIFICATIONS } from '../../CertificationConstants';
import { useAuth } from '../../context/AuthContext';
import { Enrollment } from '../../CertificationTypes';

// ─── Color helpers (badge → Tailwind class) ────────────────────────────────
const BADGE_DOT: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

const BADGE_TAG: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── Stat card (matches provider stat tile style) ──────────────────────────
function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: 'default' | 'success' | 'alert';
}) {
  const cls =
    tone === 'alert'
      ? 'text-rose-700 bg-rose-50 border-rose-100'
      : tone === 'success'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
        : 'text-slate-700 bg-white border-slate-200';

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-xs opacity-80">{hint}</p>
    </article>
  );
}

// ─── Payment status badge ──────────────────────────────────────────────────
function PaymentBadge({ status }: { status: Enrollment['paymentStatus'] }) {
  if (status === 'Paid')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle size={10} /> Paid
      </span>
    );
  if (status === 'Partial')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        <Clock size={10} /> Partial
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
      <AlertCircle size={10} /> Pending
    </span>
  );
}

// ─── Enrollment row card ───────────────────────────────────────────────────
function EnrollmentRow({ enrollment }: { enrollment: Enrollment }) {
  const navigate = useNavigate();
  const cert = CERTIFICATIONS.find((c) => c.id === enrollment.certificationId);
  const isComplete = enrollment.completionPercentage === 100;
  const dot = BADGE_DOT[enrollment.badgeColor] ?? BADGE_DOT.blue;
  const tag = BADGE_TAG[enrollment.badgeColor] ?? BADGE_TAG.blue;

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
      {/* Avatar dot */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${dot} text-sm font-bold text-white`}
      >
        {enrollment.certificationName.charAt(0)}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{enrollment.certificationName}</p>
          <span className={`border rounded-full px-2 py-0.5 text-[10px] font-semibold ${tag}`}>
            {cert?.tier ?? 'Entry'}
          </span>
          <PaymentBadge status={enrollment.paymentStatus} />
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 max-w-[160px] overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#4A6741] transition-all duration-500"
              style={{ width: `${enrollment.completionPercentage}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {enrollment.completionPercentage}% · {enrollment.modulesCompleted}/{cert?.modulesCount ?? 0} modules
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {enrollment.paymentStatus === 'Pending' && (
          <button
            onClick={() => navigate(`/learner/checkout/${enrollment.slug}`)}
            className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
            title="Retry Payment"
          >
            <RefreshCcw size={13} />
          </button>
        )}
        {isComplete ? (
          <button
            onClick={() => navigate(`/learner/certifications/certificate/${enrollment.id}`)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition flex items-center gap-1"
          >
            <Download size={12} /> Certificate
          </button>
        ) : (
          <button
            onClick={() => navigate(`/learner/certifications/modules/${enrollment.id}`)}
            className="rounded-md bg-[#4A6741] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3d5736] transition flex items-center gap-1"
          >
            <Play size={12} /> Continue
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Achievement badge ─────────────────────────────────────────────────────
function AchievementBadge({ icon, label, unlocked }: { icon: string; label: string; unlocked: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${unlocked ? 'border-emerald-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50 opacity-50 grayscale'
        }`}
    >
      {!unlocked && <Lock size={10} className="text-slate-300 self-end absolute" />}
      <span className="text-3xl">{icon}</span>
      <p className="text-[11px] font-semibold text-slate-700">{label}</p>
      {unlocked && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
          <CheckCircle size={9} /> Unlocked
        </span>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export const LearnerDashboard: React.FC = () => {
  const { enrollments, syncEnrollments, loading } = useEnrollmentStore();
  const { user, upgradeUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.includes('/certificate')
    ? 'courses'
    : location.pathname.includes('/enrollments')
      ? 'achievements'
      : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'achievements'>(currentTab);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [patientUpgradeLoading, setPatientUpgradeLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'THERAPIST' | 'PSYCHOLOGIST' | 'PSYCHIATRIST' | 'COACH'>('THERAPIST');

  React.useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  React.useEffect(() => {
    void syncEnrollments();
  }, [syncEnrollments]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalEnrollments = enrollments.length;
  const completed = enrollments.filter((e: Enrollment) => e.completionPercentage === 100).length;
  const inProgress = enrollments.filter(
    (e: Enrollment) => e.completionPercentage > 0 && e.completionPercentage < 100,
  ).length;
  const totalModulesCompleted = enrollments.reduce(
    (acc: number, e: Enrollment) => acc + (e.modulesCompleted ?? 0),
    0,
  );
  const overallProgress =
    totalEnrollments > 0
      ? Math.round(
        enrollments.reduce((acc: number, e: Enrollment) => acc + e.completionPercentage, 0) / totalEnrollments,
      )
      : 0;
  const totalAmountPaid = enrollments.reduce((acc: number, e: Enrollment) => acc + (e.amountPaid ?? 0), 0);

  const availableCerts = CERTIFICATIONS.filter(
    (c) => !enrollments.find((e: Enrollment) => e.certificationId === c.id),
  );

  // ── Achievements ─────────────────────────────────────────────────────────
  const achievements = [
    { icon: '🎯', label: 'First Enrollment', unlocked: totalEnrollments >= 1 },
    { icon: '🔥', label: '3-Day Streak', unlocked: true },
    { icon: '📚', label: '5 Modules Done', unlocked: totalModulesCompleted >= 5 },
    { icon: '🏆', label: 'First Certificate', unlocked: completed >= 1 },
    { icon: '⚡', label: 'Fast Learner', unlocked: overallProgress >= 50 },
    { icon: '🌟', label: 'Pro Learner', unlocked: completed >= 2 },
  ];

  const handleProviderUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      await upgradeUserRole(selectedRole);
      navigate('/onboarding/provider-setup');
    } catch (err) {
      alert('Failed to upgrade role. Please try again.');
    } finally {
      setUpgradeLoading(false);
      setShowRoleModal(false);
    }
  };

  const handlePatientUpgrade = async () => {
    setPatientUpgradeLoading(true);
    try {
      await upgradeUserRole('patient');
      navigate('/patient/preferences');
    } catch (err) {
      alert('Failed to upgrade to patient. Please try again.');
    } finally {
      setPatientUpgradeLoading(false);
      setShowPatientModal(false);
    }
  };

  if (loading && enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8 h-14 w-80 animate-pulse rounded-lg bg-gray-200" />
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`sk-${idx}`} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </section>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Greeting & Stats (Only on Overview) ───────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
            <div>
              <h1 className="mb-2 font-serif text-3xl font-bold text-slate-900">
                {user?.firstName ? `Welcome back, ${user.firstName}!` : 'Welcome to MANAS360 Learner'}
              </h1>
              <p className="text-sm text-slate-600">Track your progress and discover new certifications.</p>
            </div>

            {/* Overall progress pill */}
            <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Overall Progress</p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">{overallProgress}%</p>
              <p className="mt-1 text-xs text-slate-500">{totalModulesCompleted} modules completed</p>
            </div>
          </div>

          {/* ── Stat row ──────────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatCard label="Enrolled" value={totalEnrollments} hint="Certifications" tone="default" />
            <StatCard label="Completed" value={completed} hint="Certificates earned" tone="success" />
            <StatCard label="In Progress" value={inProgress} hint="Active courses" tone={inProgress > 0 ? 'default' : 'default'} />
            <StatCard label="Invested" value={`₹${totalAmountPaid.toLocaleString()}`} hint="Total amount paid" tone="default" />
          </section>
        </>
      )}

      {/* ── Tab: Overview ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Active enrollments */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Active Enrollments</h2>
            </div>

            <div className="space-y-3">
              {enrollments.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                  <BookOpen size={28} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500 mb-3">No active enrollments</p>
                  <button
                    onClick={() => navigate('/learner/certificate')}
                    className="rounded-lg bg-[#4A6741] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d5736] transition inline-flex items-center gap-1"
                  >
                    Browse Certifications <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                enrollments.map((en: Enrollment) => (
                  <EnrollmentRow key={en.id} enrollment={en} />
                ))
              )}
            </div>
          </article>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Quick stats */}
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Certificates Earned', value: completed, icon: Award },
                  { label: 'Modules Finished', value: totalModulesCompleted, icon: CheckCircle },
                  { label: 'Courses Available', value: availableCerts.length, icon: BookOpen },
                  { label: 'Overall Progress', value: `${overallProgress}%`, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Icon size={14} className="text-[#4A6741]" />
                      {label}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Recommended next */}
            {availableCerts.length > 0 && (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Recommended Next</h2>
                <div className="space-y-2">
                  {availableCerts.slice(0, 3).map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 cursor-pointer transition group"
                      onClick={() => navigate(`/learner/certifications/${cert.slug}`)}
                    >
                      <div
                        className={`h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold ${BADGE_DOT[cert.badgeColor] ?? BADGE_DOT.blue
                          }`}
                      >
                        {cert.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{cert.name}</p>
                        <p className="text-[11px] text-slate-400">{cert.tier} · {cert.duration_weeks}w</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-[#4A6741] transition flex-shrink-0" />
                    </div>
                  ))}
                  <a
                    href="/learner/certificate"
                    className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-[#4A6741] hover:underline pt-1"
                  >
                    View all courses <ArrowRight size={11} />
                  </a>
                </div>
              </article>
            )}

            {/* Book a Session CTA */}
            <article className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-sky-900">Need Support?</p>
                  <p className="mt-0.5 text-xs text-sky-700 leading-relaxed">
                    Book a therapy session and talk to a professional today.
                  </p>
                </div>
                <button
                  onClick={() => setShowPatientModal(true)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
                >
                  <ArrowRight size={12} />
                  Book a Session
                </button>
              </div>
            </article>

            {/* Upgrade CTA */}
            <article className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">Become a Provider</p>
                  <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                    Ready to help patients? Upgrade your role to unlock clinical tools and patient matching.
                  </p>
                </div>
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
                >
                  <ArrowRight size={12} />
                  Upgrade
                </button>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* ── Tab: Courses (Available Certifications) ────────────────────── */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Available certifications grid */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Available Certifications <span className="ml-1 text-slate-400 font-normal">({availableCerts.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Not yet enrolled</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {availableCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 cursor-pointer hover:border-[#4A6741] hover:bg-[#f9fbf8] transition group"
                  onClick={() => navigate(`/learner/certifications/${cert.slug}`)}
                >
                  <div
                    className={`h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-sm ${BADGE_DOT[cert.badgeColor] ?? BADGE_DOT.blue
                      }`}
                  >
                    {cert.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{cert.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE_TAG[cert.badgeColor] ?? BADGE_TAG.blue}`}>
                        {cert.tier}
                      </span>
                      <span className="text-[10px] text-slate-400">{cert.duration_weeks}w</span>
                      <span className="text-[10px] font-semibold text-slate-700">
                        {cert.price_inr === 0 ? 'Free' : `₹${cert.price_inr.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-[#4A6741] transition flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {/* ── Tab: Achievements ─────────────────────────────────────────────── */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* My enrollments */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                My Enrollments <span className="ml-1 text-slate-400 font-normal">({totalEnrollments})</span>
              </h2>
            </div>

            {enrollments.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium mb-4">No enrollments yet.</p>
                <button
                  onClick={() => navigate('/learner/certificate')}
                  className="rounded-lg bg-[#4A6741] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d5736] transition inline-flex items-center gap-1"
                >
                  Browse Certifications <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((en: Enrollment) => (
                  <EnrollmentRow key={en.id} enrollment={en} />
                ))}
              </div>
            )}
          </article>

          {/* Badges */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Achievement Badges</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {achievements.map((a) => (
                <AchievementBadge key={a.label} {...a} />
              ))}
            </div>
          </article>

          {/* Certificates earned */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Certificates Earned <span className="ml-1 text-slate-400 font-normal">({completed})</span>
              </h2>
            </div>

            {completed === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <Award size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">
                  Complete a course to earn your first certificate!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments
                  .filter((e: Enrollment) => e.completionPercentage === 100)
                  .map((en: Enrollment) => (
                    <div
                      key={en.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{en.certificationName}</p>
                        <p className="text-xs text-slate-500">Completed · {en.enrollmentDate}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/learner/certifications/certificate/${en.id}`)}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition flex items-center gap-1"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </article>

          {/* Journey summary */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Courses Enrolled', value: totalEnrollments, tone: 'default' as const },
              { label: 'Certificates Earned', value: completed, tone: 'success' as const },
              { label: 'Modules Done', value: totalModulesCompleted, tone: 'default' as const },
              { label: 'Amount Invested', value: `₹${totalAmountPaid.toLocaleString()}`, tone: 'default' as const },
            ].map(({ label, value, tone }) => (
              <StatCard key={label} label={label} value={value} hint="Total" tone={tone} />
            ))}
          </section>

          {/* Book Session Card */}
          <article className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-sky-900">Need a therapy session?</p>
                <p className="mt-0.5 text-xs text-sky-700">
                  Upgrade to a Patient role and book a session with our professionals.
                </p>
              </div>
              <button
                onClick={() => setShowPatientModal(true)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
              >
                Book a Session
              </button>
            </div>
          </article>

          {/* Upgrade card */}
          <article className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Ready to help others?</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Upgrade to a Provider role and start seeing patients on MANAS360.
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
              >
                Become a Provider
              </button>
            </div>
          </article>
        </div>
      )}

      {/* Patient Upgrade Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Upgrade to Patient</h3>
            <p className="mb-6 text-sm text-slate-600">Are you sure you want to upgrade to a Patient account to book a session?</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPatientModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                disabled={patientUpgradeLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handlePatientUpgrade()}
                disabled={patientUpgradeLoading}
                className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {patientUpgradeLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Select Provider Role</h3>
            <p className="mb-4 text-sm text-slate-600">Choose the role that best matches your qualifications.</p>
            
            <div className="space-y-3">
              {(['THERAPIST', 'PSYCHOLOGIST', 'PSYCHIATRIST', 'COACH'] as const).map((role) => (
                <label key={role} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selectedRole === role ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="providerRole"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-slate-900 capitalize">{role.toLowerCase()}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                disabled={upgradeLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleProviderUpgrade()}
                disabled={upgradeLoading}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {upgradeLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnerDashboard;
