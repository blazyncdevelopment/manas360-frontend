import { useEffect, useState } from 'react';
import CorporateShellLayout from '../../components/corporate/CorporateShellLayout';
import { corporateApi } from '../../api/corporate.api';

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
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await corporateApi.getEmployees('techcorp-india', { limit: 100 });
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
    if (!editingEmployee) return;
    try {
      setIsSaving(true);
      await corporateApi.updateEmployee(editingEmployee.id, {
        name: editingEmployee.name,
        email: editingEmployee.email,
        phone: editingEmployee.phone || '',
        department: editingEmployee.department || '',
        manager: editingEmployee.managerName || '',
      }, 'techcorp-india');
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CorporateShellLayout title="Employee Directory" subtitle="All enrolled employees for this company.">
      {loading ? <div className="text-sm text-ink-600">Loading employees...</div> : null}
      {error ? <div className="text-sm text-rose-600">{error}</div> : null}
      {!loading && !error ? (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
          <table className="min-w-full divide-y divide-ink-100 text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-500">
                    No employees found. Enroll employees to see them here.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-ink-700">{r.name}</td>
                    <td className="px-4 py-3 text-ink-600">{r.email}</td>
                    <td className="px-4 py-3 text-ink-600">{r.phone || '-'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.department || '-'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.managerName || '-'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.sessionsUsed}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingEmployee(r)}
                        className="text-sm font-medium text-sage-600 hover:text-sage-700"
                      >
                        Edit
                      </button>
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
