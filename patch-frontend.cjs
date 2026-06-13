const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/Companies.tsx', 'utf8');

// 1. Add state
const statePattern = /const \[acceptForm, setAcceptForm\] = useState\(\{ userCount: '', pricePerSeat: '' \}\);/;
const newState = `const [acceptForm, setAcceptForm] = useState({ userCount: '', pricePerSeat: '' });
  const [editLead, setEditLead] = useState<DemoRequestRow | null>(null);
  const [editForm, setEditForm] = useState<Partial<DemoRequestRow>>({});`;
content = content.replace(statePattern, newState);

// 2. Add handleEdit handler
const rejectPattern = /const handleReject = async \(\) => \{[\s\S]*?finally \{\s*setActionLoading\(null\);\s*\}\s*\};/;
const rejectMatch = content.match(rejectPattern);
if (rejectMatch) {
  const newHandler = `
  const handleEdit = async () => {
    if (!editLead) return;
    setActionLoading(editLead.id);
    try {
      const payload = {
        companyName: editForm.companyName || editForm.company_name,
        contactName: editForm.contactName || editForm.contact_name,
        workEmail: editForm.contactEmail || editForm.work_email,
        phone: editForm.phone || editForm.phone_number,
        industry: editForm.industry,
        companySize: editForm.companySize || editForm.company_size,
        country: editForm.country,
        organizationType: editForm.organizationType || editForm.organization_type
      };
      // Send mapped fields to backend
      const res = await corporateApi.updateDemoRequest(editLead.id, payload);
      updateLeadStatus(editLead.id, payload);
      flash('success', res.message ?? 'Lead updated successfully.');
      setEditLead(null);
    } catch (err: any) {
      flash('error', err?.response?.data?.message ?? err?.message ?? 'Failed to update lead.');
    } finally {
      setActionLoading(null);
    }
  };
`;
  content = content.replace(rejectMatch[0], rejectMatch[0] + newHandler);
}

// 3. Add Edit button
const viewBtnPattern = /<button[\s\S]*?onClick=\{\(\) => setViewLead\(req\)\}[\s\S]*?<\/button>/;
const viewBtnMatch = content.match(viewBtnPattern);
if (viewBtnMatch) {
  const newBtn = `
                              <button
                                onClick={() => { setEditLead(req); setEditForm(req); }}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:opacity-40"
                              >
                                ✏️ Edit
                              </button>`;
  content = content.replace(viewBtnMatch[0], viewBtnMatch[0] + newBtn);
}

// 4. Add Edit Modal
const rejectModalPattern = /\{\/\* ── Reject Modal ── \*\/\}/;
const rejectModalIndex = content.indexOf('{/* ── Reject Modal ── */}');
if (rejectModalIndex !== -1) {
  const editModal = `
          {/* ── Edit Modal ── */}
          {editLead && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl">
                <h3 className="font-display text-lg font-bold text-ink-800">Edit Demo Request</h3>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Company Name</label>
                    <input
                      type="text"
                      value={editForm.companyName || editForm.company_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Contact Name</label>
                    <input
                      type="text"
                      value={editForm.contactName || editForm.contact_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Email</label>
                    <input
                      type="text"
                      value={editForm.contactEmail || editForm.work_email || ''}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone || editForm.phone_number || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Industry</label>
                    <input
                      type="text"
                      value={editForm.industry || ''}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Company Size</label>
                    <input
                      type="text"
                      value={editForm.companySize || editForm.company_size || ''}
                      onChange={(e) => setEditForm({ ...editForm, companySize: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleEdit}
                    disabled={actionLoading === editLead.id}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === editLead.id ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditLead(null)}
                    className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
`;
  content = content.slice(0, rejectModalIndex) + editModal + content.slice(rejectModalIndex);
}

fs.writeFileSync('src/pages/admin/Companies.tsx', content);
console.log("Frontend patched.");
