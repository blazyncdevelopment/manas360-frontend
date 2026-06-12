import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { corporateApi, type DemoRequestRow } from '../../api/corporate.api';

// ─── helpers ────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    ACCOUNT_CREATED: 'bg-purple-100 text-purple-700',
  };
  const cls = map[status?.toUpperCase()] ?? 'bg-ink-100 text-ink-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {status || 'NEW'}
    </span>
  );
}

type CompanyItem = {
  id: string;
  companyKey: string;
  name: string;
};

type CompanyDashboard = {
  company: {
    id: string;
    companyKey: string;
    name: string;
    employeeLimit: number;
    sessionQuota: number;
    ssoProvider: string;
  };
  summary: {
    enrolledEmployees: number;
    activeUsers: number;
    engagementRate: number;
    sessionsAllocated: number;
    sessionsUsed: number;
    utilizationRate: number;
    wellbeingScore: number;
  };
  burnoutRisk: {
    high: number;
    medium: number;
    low: number;
  };
  departmentBreakdown: Array<{
    department: string;
    enrolled: number;
    active: number;
    utilizationPct: number;
    sessionsUsed: number;
    riskIndicator: string;
  }>;
  reports: Array<{
    id: string;
    type: string;
    quarter: string;
    format: string;
    generatedAt: string;
  }>;
  aiInsights: string[];
};

const numberFormat = new Intl.NumberFormat('en-IN');

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'companies' | 'demo-requests'>('companies');
  const [demoRequests, setDemoRequests] = useState<DemoRequestRow[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);

  // ── Demo-request action state ──
  const [viewLead, setViewLead] = useState<DemoRequestRow | null>(null);
  const [acceptLead, setAcceptLead] = useState<DemoRequestRow | null>(null);
  const [rejectLead, setRejectLead] = useState<DemoRequestRow | null>(null);
  const [createAccountLead, setCreateAccountLead] = useState<DemoRequestRow | null>(null);
  const [acceptForm, setAcceptForm] = useState({ userCount: '', pricePerSeat: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null); // id of row being actioned
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null); // shown inside the modal

  const flash = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const updateLeadStatus = (id: string, patch: Partial<DemoRequestRow>) =>
    setDemoRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAccept = async () => {
    if (!acceptLead) return;
    const userCount = Number(acceptForm.userCount);
    const pricePerSeat = Number(acceptForm.pricePerSeat);
    if (!userCount || !pricePerSeat) {
      setAcceptError('Please enter valid User Count and Price per Seat.');
      return;
    }
    setAcceptError(null);
    setActionLoading(acceptLead.id);
    const leadId = acceptLead.id; // capture before any state mutation
    try {
      const res = await corporateApi.acceptDemoRequest(leadId, userCount, pricePerSeat);
      updateLeadStatus(leadId, { status: 'ACCEPTED', proposalUrl: res.proposalUrl });
      flash('success', res.message ?? 'Lead accepted — proposal sent!');
      setAcceptLead(null);
      setAcceptForm({ userCount: '', pricePerSeat: '' });
      setAcceptError(null);
    } catch (err: any) {
      console.error('[Accept Lead] Full error:', {
        status: err?.response?.status,
        url: err?.config?.url,
        data: err?.response?.data,
        message: err?.message,
      });
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to accept lead. Check console for details.';
      setAcceptError(String(msg));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectLead) return;
    setActionLoading(rejectLead.id);
    try {
      const res = await corporateApi.rejectDemoRequest(rejectLead.id);
      updateLeadStatus(rejectLead.id, { status: 'REJECTED' });
      flash('success', res.message ?? 'Lead rejected.');
      setRejectLead(null);
    } catch (err: any) {
      flash('error', err?.response?.data?.message ?? err?.message ?? 'Failed to reject lead.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAccount = async () => {
    if (!createAccountLead) return;
    setActionLoading(createAccountLead.id);
    try {
      const res = await corporateApi.createAccountFromLead(createAccountLead.id);
      updateLeadStatus(createAccountLead.id, { status: 'ACCOUNT_CREATED', corporateAccountId: res.company?.id });
      flash('success', res.message ?? 'Corporate account created!');
      setCreateAccountLead(null);
    } catch (err: any) {
      flash('error', err?.response?.data?.message ?? err?.message ?? 'Failed to create account.');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const loadCompanies = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const rows = (await corporateApi.listCompanies()) as CompanyItem[];
        setCompanies(rows);
        if (rows[0]?.companyKey) {
          setSelectedKey(rows[0].companyKey);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load companies.');
      } finally {
        setLoading(false);
      }
    };

    void loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedKey) return;

    const loadDashboard = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const payload = (await corporateApi.getDashboard(selectedKey)) as CompanyDashboard;
        setDashboard(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load company dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [selectedKey]);

  useEffect(() => {
    if (activeTab !== 'demo-requests') return;
    const loadDemoRequests = async (): Promise<void> => {
      setDemoLoading(true);
      setError(null);
      try {
        const rows = await corporateApi.getDemoRequests();
        setDemoRequests(rows || []);
      } catch (err) {
        // If endpoint doesn't exist yet, we will just show empty state
        console.error(err);
      } finally {
        setDemoLoading(false);
      }
    };
    void loadDemoRequests();
  }, [activeTab]);

  const topDepartments = useMemo(
    () => (dashboard?.departmentBreakdown || []).slice().sort((a, b) => b.utilizationPct - a.utilizationPct).slice(0, 5),
    [dashboard?.departmentBreakdown],
  );

  return (
    <div className="space-y-4 min-h-screen">
      <div className="flex gap-2 border-b border-ink-100 pb-2">
        <button
          onClick={() => setActiveTab('companies')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'companies' ? 'bg-sage-100 text-sage-900' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
            }`}
        >
          Corporate Clients
        </button>
        <button
          onClick={() => setActiveTab('demo-requests')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'demo-requests' ? 'bg-sage-100 text-sage-900' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
            }`}
        >
          Demo Requests
        </button>
      </div>

      {activeTab === 'companies' ? (
        <>
          <div className="rounded-xl border border-ink-100 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-800">Corporate Clients</h2>
                <p className="mt-1 text-sm text-ink-600">
                  Live enterprise account control center with utilization, risk, and reporting visibility.
                </p>
              </div>
              <div className="min-w-[260px]">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Select Company</label>
                <select
                  value={selectedKey}
                  onChange={(event) => setSelectedKey(event.target.value)}
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700 outline-none ring-sage-500 transition focus:ring-2"
                >
                  <option value="">Choose company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.companyKey}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <StatCard label="Employees" value={numberFormat.format(dashboard?.summary.enrolledEmployees ?? 0)} />
            <StatCard label="Active Users" value={numberFormat.format(dashboard?.summary.activeUsers ?? 0)} />
            <StatCard label="Utilization" value={`${dashboard?.summary.utilizationRate ?? 0}%`} />
            <StatCard label="Engagement" value={`${dashboard?.summary.engagementRate ?? 0}%`} />
            <StatCard label="Wellbeing" value={`${dashboard?.summary.wellbeingScore ?? 0}/100`} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
              <div className="border-b border-ink-100 px-4 py-3">
                <h3 className="font-display text-base font-bold text-ink-800">Department Utilization</h3>
                <p className="mt-1 text-xs text-ink-500">Highest utilization departments across the selected enterprise account.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ink-100">
                  <thead className="bg-ink-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Enrolled</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Active</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Sessions</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-500">Loading department data...</td>
                      </tr>
                    ) : topDepartments.length ? (
                      topDepartments.map((dept) => (
                        <tr key={dept.department}>
                          <td className="px-4 py-3 text-sm font-semibold text-ink-800">{dept.department}</td>
                          <td className="px-4 py-3 text-sm text-ink-700">{numberFormat.format(dept.enrolled)}</td>
                          <td className="px-4 py-3 text-sm text-ink-700">{numberFormat.format(dept.active)}</td>
                          <td className="px-4 py-3 text-sm text-ink-700">{numberFormat.format(dept.sessionsUsed)}</td>
                          <td className="px-4 py-3 text-sm text-ink-700">{dept.utilizationPct}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-500">No department analytics available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-ink-100 bg-white p-4">
                <h3 className="font-display text-base font-bold text-ink-800">Burnout Risk Split</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <RiskRow label="High" value={dashboard?.burnoutRisk.high ?? 0} tone="high" />
                  <RiskRow label="Medium" value={dashboard?.burnoutRisk.medium ?? 0} tone="medium" />
                  <RiskRow label="Low" value={dashboard?.burnoutRisk.low ?? 0} tone="low" />
                </div>
              </div>

              <div className="rounded-xl border border-ink-100 bg-white p-4">
                <h3 className="font-display text-base font-bold text-ink-800">Recent Reports</h3>
                <div className="mt-3 space-y-2">
                  {(dashboard?.reports || []).slice(0, 4).map((report) => (
                    <div key={report.id} className="rounded-lg bg-ink-50 px-3 py-2">
                      <p className="text-sm font-medium text-ink-800">{report.type}</p>
                      <p className="text-xs text-ink-500">
                        {report.quarter} · {String(report.format).toUpperCase()}
                      </p>
                    </div>
                  ))}
                  {!dashboard?.reports?.length ? <p className="text-sm text-ink-500">No reports available.</p> : null}
                </div>
              </div>

              <div className="rounded-xl border border-ink-100 bg-white p-4">
                <h3 className="font-display text-base font-bold text-ink-800">AI Insights</h3>
                <div className="mt-3 space-y-2">
                  {(dashboard?.aiInsights || []).map((item) => (
                    <div key={item} className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                      {item}
                    </div>
                  ))}
                  {!dashboard?.aiInsights?.length ? <p className="text-sm text-ink-500">No insights available.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Flash banner ── */}
          {actionMsg && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${actionMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
                }`}
            >
              <span>{actionMsg.type === 'success' ? '✓' : '✕'}</span>
              {actionMsg.text}
            </div>
          )}

          {/* ── Main table card ── */}
          <div className="rounded-xl border border-ink-100 bg-white shadow-sm">
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-800">B2B Demo Requests</h2>
              <p className="mt-1 text-sm text-ink-500">
                Manage inbound enterprise demo requests — view, accept, reject or create corporate accounts.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-100">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Company &amp; Contact</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Details</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {demoLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink-500">
                        Loading demo requests…
                      </td>
                    </tr>
                  ) : demoRequests.length > 0 ? (
                    demoRequests.map((req) => {
                      const busy = actionLoading === req.id;
                      const st = (req.status || 'NEW').toUpperCase();
                      const name = req.company_name || req.companyName || '-';
                      return (
                        <tr key={req.id} className="transition hover:bg-ink-50/40">
                          <td className="px-5 py-4 min-w-[200px]">
                            <div className="text-sm font-semibold text-ink-800">{name}</div>
                            <div className="mt-0.5 text-xs text-ink-600">{req.contactName || req.contact_name || '-'}</div>
                            <div className="mt-0.5 text-xs text-ink-500">
                              {req.contactEmail || req.work_email} · {req.phone || req.phone_number}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-ink-700">{req.industry || '-'}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
                              {(req.companySize || req.company_size) && (
                                <span className="rounded-md bg-ink-100 px-1.5 py-0.5">
                                  {req.companySize || req.company_size} emp.
                                </span>
                              )}
                              {req.country && <span>{req.country}</span>}
                            </div>
                            {(req.organizationType || req.organization_type) && (
                              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-sage-600">
                                {req.organizationType || req.organization_type}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {statusBadge(st)}
                            {req.proposalUrl && (
                              <a
                                href={req.proposalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-1 text-[10px] text-sage-600 hover:underline"
                              >
                                📄 View Proposal
                              </a>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-ink-600">
                            {(req.requestedAt || req.created_at)
                              ? new Date(req.requestedAt ?? req.created_at!).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                              : 'N/A'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View */}
                              <button
                                onClick={() => setViewLead(req)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:opacity-40"
                              >
                                👁 View
                              </button>

                              {/* Accept — only if not already accepted/account-created */}
                              {!['ACCEPTED', 'ACCOUNT_CREATED'].includes(st) && (
                                <button
                                  onClick={() => {
                                    setAcceptLead(req);
                                    setAcceptForm({ userCount: '', pricePerSeat: '' });
                                  }}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
                                >
                                  ✓ Accept
                                </button>
                              )}

                              {/* Reject — only if not already rejected/account-created */}
                              {!['REJECTED', 'ACCOUNT_CREATED'].includes(st) && (
                                <button
                                  onClick={() => setRejectLead(req)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-40"
                                >
                                  {busy ? '…' : '✕ Reject'}
                                </button>
                              )}

                              {/* Create Account — only once accepted and not yet provisioned */}
                              {st === 'ACCEPTED' && !req.corporateAccountId && (
                                <button
                                  onClick={() => setCreateAccountLead(req)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-40"
                                >
                                  {busy ? '…' : '🏢 Create Account'}
                                </button>
                              )}
                              {req.corporateAccountId && (
                                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                                  Account Active
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-ink-500">
                        No demo requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Accept Modal ── */}
          {acceptLead && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl">
                <h3 className="font-display text-lg font-bold text-ink-800">Accept Lead &amp; Generate Proposal</h3>
                <p className="mt-1 text-sm text-ink-500">
                  Accepting <span className="font-semibold text-ink-700">{acceptLead.company_name || acceptLead.companyName}</span>.
                  Enter seat details to auto-generate the annual proposal PDF.
                </p>
                <div className="mt-5 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Number of Users / Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={acceptForm.userCount}
                      onChange={(e) => setAcceptForm((p) => ({ ...p, userCount: e.target.value }))}
                      placeholder="e.g. 500"
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none ring-sage-500 transition focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Price per Seat / Month (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={acceptForm.pricePerSeat}
                      onChange={(e) => setAcceptForm((p) => ({ ...p, pricePerSeat: e.target.value }))}
                      placeholder="e.g. 120"
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none ring-sage-500 transition focus:ring-2"
                    />
                  </div>
                  {acceptForm.userCount && acceptForm.pricePerSeat && (
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                      <span className="text-ink-500">Annual contract value: </span>
                      <span className="font-bold text-emerald-800">
                        ₹{numberFormat.format(Number(acceptForm.userCount) * Number(acceptForm.pricePerSeat) * 12)}
                      </span>
                    </div>
                  )}
                  {/* ── Inline error banner inside modal ── */}
                  {acceptError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      <span className="font-semibold">Error: </span>{acceptError}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading === acceptLead.id}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading === acceptLead.id ? 'Sending…' : 'Accept & Send Proposal'}
                  </button>
                  <button
                    onClick={() => {
                      setAcceptLead(null);
                      setAcceptForm({ userCount: '', pricePerSeat: '' });
                      setAcceptError(null);
                    }}
                    className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ── Reject Modal ── */}
          {rejectLead && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl">
                <h3 className="font-display text-lg font-bold text-ink-800">Reject Demo Request</h3>
                <p className="mt-2 text-sm text-ink-500">
                  Are you sure you want to reject the demo request from <span className="font-semibold text-ink-700">{rejectLead.company_name || rejectLead.companyName}</span>?
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === rejectLead.id}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === rejectLead.id ? 'Rejecting…' : 'Yes, Reject Request'}
                  </button>
                  <button
                    onClick={() => setRejectLead(null)}
                    className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ── Create Account Modal ── */}
          {createAccountLead && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl">
                <h3 className="font-display text-lg font-bold text-ink-800">Create Corporate Account</h3>
                <p className="mt-2 text-sm text-ink-500">
                  Are you sure you want to create a corporate account for <span className="font-semibold text-ink-700">{createAccountLead.company_name || createAccountLead.companyName}</span>?
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCreateAccount}
                    disabled={actionLoading === createAccountLead.id}
                    className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading === createAccountLead.id ? 'Creating…' : 'Yes, Create Account'}
                  </button>
                  <button
                    onClick={() => setCreateAccountLead(null)}
                    className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ── View Slide-Over ── */}
          {viewLead && createPortal(
            <div
              className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
              onClick={() => setViewLead(null)}
            >
              <div
                className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-6 py-4">
                  <h3 className="font-display text-base font-bold text-ink-800">Lead Details</h3>
                  <button onClick={() => setViewLead(null)} className="text-ink-400 hover:text-ink-700">
                    ✕
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Company</p>
                    <p className="mt-0.5 text-base font-bold text-ink-800">
                      {viewLead.company_name || viewLead.companyName}
                    </p>
                  </div>
                  {(
                    [
                      ['Contact Name', viewLead.contactName || viewLead.contact_name],
                      ['Work Email', viewLead.contactEmail || viewLead.work_email],
                      ['Phone', viewLead.phone || viewLead.phone_number],
                      ['Industry', viewLead.industry],
                      ['Company Size', viewLead.companySize || viewLead.company_size],
                      ['Country', viewLead.country],
                      ['Org Type', viewLead.organizationType || viewLead.organization_type],
                      ['UTM Source', viewLead.utm_source],
                      ['UTM Medium', viewLead.utm_medium],
                      ['UTM Campaign', viewLead.utm_campaign],
                      ['Submitted', (viewLead.requestedAt || viewLead.created_at) ? new Date(viewLead.requestedAt ?? viewLead.created_at!).toLocaleString() : '—'],
                    ] as [string, string | undefined | null][]
                  ).map(([label, val]) =>
                    val ? (
                      <div key={label}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
                        <p className="mt-0.5 text-sm text-ink-700">{val}</p>
                      </div>
                    ) : null,
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Status</p>
                    <div className="mt-1">{statusBadge(viewLead.status || 'NEW')}</div>
                  </div>
                  {viewLead.proposalUrl && (
                    <a
                      href={viewLead.proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 text-center"
                    >
                      📄 Download Proposal PDF
                    </a>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink-800">{value}</p>
    </div>
  );
}

function RiskRow({ label, value, tone }: { label: string; value: number; tone: 'high' | 'medium' | 'low' }) {
  const toneClass = tone === 'high' ? 'text-red-700 bg-red-50' : tone === 'medium' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50';
  return (
    <div className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${toneClass}`}>
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold">{value}%</span>
    </div>
  );
}
