import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Award,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { id: 'overview', to: '/learner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'courses', to: '/learner/certificate', icon: BookOpen, label: 'Browse Certifications' },
  { id: 'achievements', to: '/learner/enrollments', icon: Award, label: 'My Enrollments' },
];

export const LearnerDashboardLayout = () => {
  const { user, logout, upgradeUserRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [patientUpgradeLoading, setPatientUpgradeLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'THERAPIST' | 'PSYCHOLOGIST' | 'PSYCHIATRIST' | 'COACH'>('THERAPIST');

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/auth/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProviderUpgrade = async () => {
    setUpgrading(true);
    try {
      await upgradeUserRole(selectedRole);
      navigate('/onboarding/provider-setup');
    } catch (err) {
      alert('Failed to upgrade role. Please try again.');
    } finally {
      setUpgrading(false);
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

  const SidebarContent = () => (
    <aside className="w-64 h-screen bg-[#F5F3F0] border-r border-gray-200 flex flex-col fixed left-0 top-0">
      {/* Logo — identical to ProviderSidebar */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-gray-200 shrink-0">
        <img src="/AppIcon.jpeg" alt="MANAS360 logo" className="w-8 h-8 rounded-lg object-cover" />
        <span className="font-bold text-lg text-[#2D4128]">MANAS360</span>
        <span className="ml-auto text-[10px] font-medium bg-[#E8EFE6] text-[#4A6741] px-2 py-0.5 rounded-full">
          Learner
        </span>
      </div>

      {/* Nav — identical pattern to ProviderSidebar */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        <div>
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              LEARNER
            </span>
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                    ? 'bg-[#E8EFE6] text-[#2D4128] font-semibold'
                    : 'text-gray-600 hover:bg-[#EFEDE9]'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-[#4A6741]' : 'text-gray-500'}>
                      <Icon size={18} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer profile card — identical pattern to ProviderSidebar */}
      <div className="border-t border-gray-200 p-4 shrink-0 mt-auto bg-[#F5F3F0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E8EFE6] flex items-center justify-center text-[#4A6741] font-bold text-sm">
            {user?.firstName ? user.firstName.charAt(0) : 'L'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-gray-500">Learner</p>
          </div>
        </div>

        {/* Book a Session */}
        <button
          type="button"
          onClick={() => setShowPatientModal(true)}
          disabled={patientUpgradeLoading}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
        >
          Book a Session
        </button>

        {/* Upgrade */}
        <button
          type="button"
          onClick={() => setShowRoleModal(true)}
          disabled={upgrading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
        >
          Become a Provider
        </button>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile top bar — matches HubLayout header style */}
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/AppIcon.jpeg" alt="logo" className="w-6 h-6 rounded object-cover" />
            <span className="font-bold text-sm text-[#2D4128]">MANAS360</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#E8EFE6] flex items-center justify-center text-[#4A6741] font-bold text-xs">
            {user?.firstName?.charAt(0) ?? 'L'}
          </div>
        </header>

        {/* Desktop top bar — matches HubLayout */}
        <header className="hidden lg:flex h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <h1 className="font-bold text-lg text-gray-800">Workspace</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#4A6741] bg-[#f0f5ee] px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-[#4A6741] rounded-full animate-pulse" />
              Online
            </div>
            <NavLink
              to="/provider/settings"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </NavLink>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="flex items-center gap-2 p-1 pr-3 rounded-lg hover:bg-gray-100 transition disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8EFE6] flex items-center justify-center text-[#4A6741] font-bold text-xs">
                {user?.firstName ? user.firstName.charAt(0) : 'L'}
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

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
                {patientUpgradeLoading ? 'Upgrading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
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
                disabled={upgrading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleProviderUpgrade()}
                disabled={upgrading}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {upgrading ? 'Upgrading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnerDashboardLayout;
