import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/admin.api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function ComplianceDashboard() {
  const [compliance, setCompliance] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [acceptances, setAcceptances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [compRes, docsRes, accRes] = await Promise.all([
        api.get('/v1/admin/compliance/status'),
        api.get('/v1/admin/legal/documents'),
        api.get('/v1/admin/acceptances')
      ]);
      setCompliance(compRes.data);
      setDocuments(docsRes.data.documents || []);
      setAcceptances(accRes.data.acceptances || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load compliance dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group acceptances by user
  const groupedAcceptances = useMemo(() => {
    const groups: Record<string, {
      userName: string;
      email: string | null;
      phone: string | null;
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
      ip: string;
      acceptedDocs: Record<string, { acceptedAt: string; ip: string }>;
    }> = {};

    acceptances.forEach((acc) => {
      const user = acc.userName;
      if (!groups[user]) {
        groups[user] = {
          userName: user,
          email: acc.email,
          phone: acc.phone,
          firstName: acc.firstName || '',
          lastName: acc.lastName || '',
          profileImageUrl: acc.profileImageUrl,
          ip: acc.ip,
          acceptedDocs: {},
        };
      }
      groups[user].acceptedDocs[acc.documentType] = {
        acceptedAt: acc.acceptedAt,
        ip: acc.ip,
      };
      if (acc.ip && acc.ip !== '::ffff:127.0.0.1') {
        groups[user].ip = acc.ip;
      }
    });

    return Object.values(groups);
  }, [acceptances]);

  if (loading) return <div className="p-8 text-center">Loading compliance dashboard...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Compliance Dashboard</h1>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overall Compliance</p>
          <p className="text-5xl font-bold text-gray-900 mt-2">{compliance?.compliance_percentage || 0}%</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Documents</p>
          <p className="text-5xl font-bold text-amber-600 mt-2">{compliance?.pending || 0}</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Critical Gaps</p>
          <p className="text-5xl font-bold text-red-600 mt-2">{compliance?.critical_gaps?.length || 0}</p>
        </Card>
      </div>

      {/* User Acceptance Checklist */}
      <Card className="shadow overflow-hidden mt-8 mb-8 bg-white border border-gray-100 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-150 font-semibold text-gray-800 text-lg flex justify-between items-center">
          <span>User Acceptance Checklist</span>
          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 font-bold">{groupedAcceptances.length} users</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-6 py-4 text-center">Informed Consent</th>
                <th className="px-6 py-4 text-center">Privacy Policy</th>
                <th className="px-6 py-4 text-center">Terms of Service</th>
                <th className="px-6 py-4 text-center">Latest IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupedAcceptances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No acceptance records found</td>
                </tr>
              ) : (
                groupedAcceptances.map((group) => {
                  const consent = group.acceptedDocs['INFORMED_CONSENT'];
                  const privacy = group.acceptedDocs['PRIVACY_POLICY'];
                  const terms = group.acceptedDocs['TERMS_OF_SERVICE'];

                  return (
                    <tr key={group.userName} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm overflow-hidden flex-shrink-0">
                            {group.profileImageUrl ? (
                              <img src={group.profileImageUrl} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                              <span>
                                {[group.firstName, group.lastName].filter(Boolean).map(n => n[0]).join('').toUpperCase() || group.userName[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          {/* User Details */}
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 leading-snug">
                              {[group.firstName, group.lastName].filter(Boolean).join(' ') || 'User Account'}
                            </span>
                            {group.email && (
                              <span className="text-xs text-gray-500 font-medium">{group.email}</span>
                            )}
                            {group.phone && (
                              <span className="text-xs text-gray-400 font-mono mt-0.5">{group.phone}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        {consent ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Accepted
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1">
                              {new Date(consent.acceptedAt).toLocaleDateString()} {new Date(consent.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            ✗ Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {privacy ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Accepted
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1">
                              {new Date(privacy.acceptedAt).toLocaleDateString()} {new Date(privacy.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            ✗ Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {terms ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Accepted
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1">
                              {new Date(terms.acceptedAt).toLocaleDateString()} {new Date(terms.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            ✗ Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-center text-gray-500">
                        {group.ip}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legal Documents List */}
      <Card className="shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b font-medium flex items-center justify-between">
          <span>Legal Documents</span>
          <Button variant="secondary" size="sm" onClick={() => window.location.href = '/admin/compliance-documents'}>
            View All Legal Documents
          </Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b text-xs uppercase">
              <th className="px-6 py-4 text-left">Title</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-center">Version</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{doc.title}</td>
                <td className="px-6 py-4 capitalize">{doc.document_type}</td>
                <td className="px-6 py-4 text-center">v{doc.current_version}</td>
                <td className="px-6 py-4 text-center">
                  <Badge variant="default">{doc.status}</Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <Button variant="secondary" size="sm" onClick={() => window.open(`/api/v1/admin/legal/documents/${doc.id}/download`)}>
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        English-only legal documents • All actions are audited
      </p>
    </div>
  );
}
