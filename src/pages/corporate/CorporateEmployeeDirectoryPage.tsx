import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import CorporateShellLayout from '../../components/corporate/CorporateShellLayout';
import { corporateApi } from '../../api/corporate.api';
import { useCorporateKey } from './useCorporateDashboardData';

type EmployeeRow = {
  id: string;
  employeeCode?: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  managerName?: string;
  location?: string;
  sessionsUsed: number;
};

export default function CorporateEmployeeDirectoryPage() {
  const companyKey = useCorporateKey();
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [creatingAccountFor, setCreatingAccountFor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await corporateApi.getEmployees(companyKey, { limit: 100 });
      setRows(response?.rows || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !companyKey) return;
    try {
      setIsSaving(true);
      await corporateApi.updateEmployee(editingEmployee.id, {
        name: editingEmployee.name,
        email: editingEmployee.email,
        phone: editingEmployee.phone || '',
        department: editingEmployee.department || '',
        manager: editingEmployee.managerName || '',
      }, companyKey);
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAccount = async (employeeId: string) => {
    if (!companyKey) return;
    setCreatingAccountFor(employeeId);
    try {
      await corporateApi.createEmployeeAccount(employeeId, companyKey);
      alert('Account created! Welcome email and WhatsApp have been sent.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreatingAccountFor(null);
    }
  };

  return (
    <CorporateShellLayout title="Employee Directory" subtitle="All enrolled employees for this company.">
      <div className="mb-6 flex justify-end">
        <Link
          to="/corporate/employees/enrollment"
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Link>
      </div>
      {loading ? <div className="text-sm text-ink-600">Loading employees...</div> : null}
      {error ? <div className="text-sm text-rose-600">{error}</div> : null}
      {!loading && !error ? (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
          <table className="min-w-full divide-y divide-ink-100 text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-500">
                    No employees found. Enroll employees to see them here.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-ink-600 font-mono text-xs">{r.employeeCode || '-'}</td>
                    <td className="px-4 py-3 font-medium text-ink-700">{r.name}</td>
                    <td className="px-4 py-3 text-ink-600">{r.email}</td>
                    <td className="px-4 py-3 text-ink-600">{r.phone || '-'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.department || '-'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.managerName || '-'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.sessionsUsed}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleCreateAccount(r.id)}
                          disabled={creatingAccountFor === r.id}
                          className="text-sm font-medium text-ink-600 hover:text-ink-800 disabled:opacity-50"
                        >
                          {creatingAccountFor === r.id ? 'Creating...' : 'Create Account'}
                        </button>
                        <button
                          onClick={() => setEditingEmployee(r)}
                          className="text-sm font-medium text-sage-600 hover:text-sage-700"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-display text-lg font-bold text-ink-800">Edit Employee</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Name</label>
                <input
                  required
                  type="text"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
                <input
                  required
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Phone</label>
                <input
                  type="tel"
                  value={editingEmployee.phone || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Department</label>
                <input
                  type="text"
                  value={editingEmployee.department || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Manager</label>
                <input
                  type="text"
                  value={editingEmployee.managerName || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, managerName: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-ink-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CorporateShellLayout>
  );
}
