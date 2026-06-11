import { useMemo, useState } from 'react';
import CorporateShellLayout from '../../components/corporate/CorporateShellLayout';
import { corporateApi } from '../../api/corporate.api';
import { useCorporateKey } from './useCorporateDashboardData';

type BulkUploadResult = {
  requested: number;
  imported: number;
  updated: number;
  skipped: number;
  message?: string;
  errors?: Array<{ index: number; reason: string }>;
};

export default function CorporateEnrollmentPage() {
  const companyKey = useCorporateKey();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rowsText, setRowsText] = useState('');
  const [lastResult, setLastResult] = useState<BulkUploadResult | null>(null);
  const [singleEmployee, setSingleEmployee] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    location: '',
    manager: '',
  });

  const sampleCsv = useMemo(
    () => [
      'employee_id,name,email,phone,department,location,manager',
      'EMP9001,New Employee 1,new.employee1@techcorp.com,+919876543210,Engineering,Bengaluru,Manager 1',
      'EMP9002,New Employee 2,new.employee2@techcorp.com,+919876543211,Operations,Hyderabad,Manager 2',
    ].join('\n'),
    [],
  );

  const downloadTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'corporate-enrollment-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a CSV/XLSX file first.');
      return;
    }

    setLoading(true);
    setStatus(null);
    setError(null);
    setLastResult(null);
    try {
      const result = (await corporateApi.bulkUploadEmployeesFile(file, companyKey)) as BulkUploadResult;
      setStatus(result?.message || 'Employee file uploaded successfully.');
      setLastResult(result);
      setFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpload = async () => {
    const lines = rowsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setError('Please enter at least one employee line.');
      return;
    }

    const rows = lines
      .map((line) => line.split(',').map((part) => part.trim()))
      .filter((parts) => parts.length >= 5)
      .map((parts) => ({
        employeeId: parts[0],
        name: parts[1],
        email: parts[2],
        phone: parts[3],
        department: parts[4],
        location: parts[5] || 'Bengaluru',
        manager: parts[6] || 'Unassigned',
      }));

    if (!rows.length) {
      setError('Invalid manual format. Use: employeeId,name,email,phone,department[,location,manager]');
      return;
    }

    setLoading(true);
    setStatus(null);
    setError(null);
    setLastResult(null);
    try {
      const result = (await corporateApi.bulkUploadEmployees(rows, companyKey)) as BulkUploadResult;
      setStatus(result?.message || 'Employees uploaded successfully.');
      setLastResult(result);
      setRowsText('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Manual upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleUpload = async () => {
    if (!singleEmployee.employeeId || !singleEmployee.name || !singleEmployee.email || !singleEmployee.department) {
      setError('Please fill in at least the required fields: Employee ID, Name, Email, and Department.');
      return;
    }

    setLoading(true);
    setStatus(null);
    setError(null);
    setLastResult(null);
    
    try {
      const result = (await corporateApi.bulkUploadEmployees([{
        employeeId: singleEmployee.employeeId,
        name: singleEmployee.name,
        email: singleEmployee.email,
        phone: singleEmployee.phone || '',
        department: singleEmployee.department,
        location: singleEmployee.location || 'Bengaluru',
        manager: singleEmployee.manager || 'Unassigned',
      }], companyKey)) as BulkUploadResult;
      
      setStatus(result?.message || 'Employee uploaded successfully.');
      setLastResult(result);
      setSingleEmployee({ employeeId: '', name: '', email: '', phone: '', department: '', location: '', manager: '' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CorporateShellLayout title="Enrollment" subtitle="Add and onboard employees into the wellness program.">
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink-800">Bulk Enrollment</h2>
        <p className="mt-2 text-sm text-ink-600">Upload CSV/XLSX files or paste employees manually. Template format: employee_id,name,email,phone,department,location,manager.</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="text-sm text-ink-700"
          />
          <button
            type="button"
            onClick={handleFileUpload}
            disabled={loading || !file}
            className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Download Template
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-ink-700">Manual entries</p>
          <textarea
            value={rowsText}
            onChange={(event) => setRowsText(event.target.value)}
            rows={6}
            placeholder="EMP9001,New Employee 1,new.employee1@techcorp.com,+919876543210,Engineering,Bengaluru,Manager 1"
            className="w-full rounded-lg border border-ink-200 p-3 text-sm text-ink-700"
          />
          <button
            type="button"
            onClick={handleManualUpload}
            disabled={loading}
            className="mt-3 rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Upload Manual Rows'}
          </button>
        </div>

        <hr className="my-8 border-ink-100" />

        <h2 className="font-display text-lg font-bold text-ink-800">Single Employee Entry</h2>
        <p className="mt-2 text-sm text-ink-600">Quickly enroll a single employee without uploading a file.</p>
        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Employee ID *</label>
            <input
              type="text"
              value={singleEmployee.employeeId}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, employeeId: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. EMP9001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Name *</label>
            <input
              type="text"
              value={singleEmployee.name}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, name: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Email *</label>
            <input
              type="email"
              value={singleEmployee.email}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, email: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. jane@techcorp.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Phone</label>
            <input
              type="tel"
              value={singleEmployee.phone}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, phone: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. +919876543210"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Department *</label>
            <input
              type="text"
              value={singleEmployee.department}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, department: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Location</label>
            <input
              type="text"
              value={singleEmployee.location}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, location: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. Bengaluru"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Manager</label>
            <input
              type="text"
              value={singleEmployee.manager}
              onChange={(e) => setSingleEmployee({ ...singleEmployee, manager: e.target.value })}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="e.g. Manager 1"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSingleUpload}
          disabled={loading}
          className="mt-4 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Enroll Single Employee'}
        </button>


        {status ? <p className="mt-4 text-sm text-sage-700">{status}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

        {lastResult ? (
          <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-4">
            <p className="text-sm font-semibold text-ink-800">Upload Summary</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-ink-500">Requested</p>
                <p className="text-lg font-semibold text-ink-800">{lastResult.requested}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-ink-500">Imported</p>
                <p className="text-lg font-semibold text-sage-700">{lastResult.imported}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-ink-500">Updated</p>
                <p className="text-lg font-semibold text-ink-800">{lastResult.updated}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-ink-500">Skipped</p>
                <p className="text-lg font-semibold text-rose-700">{lastResult.skipped}</p>
              </div>
            </div>

            {lastResult.errors?.length ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-medium text-rose-700">Row-level Errors</p>
                <ul className="mt-2 space-y-1 text-sm text-rose-700">
                  {lastResult.errors.slice(0, 10).map((rowError) => (
                    <li key={`${rowError.index}-${rowError.reason}`}>Row {rowError.index + 1}: {rowError.reason}</li>
                  ))}
                </ul>
                {lastResult.errors.length > 10 ? (
                  <p className="mt-2 text-xs text-rose-600">Showing first 10 of {lastResult.errors.length} errors.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </CorporateShellLayout>
  );
}
