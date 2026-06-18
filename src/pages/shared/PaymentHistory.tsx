import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Layers,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { http } from '../../lib/http';
import { useEnrollmentStore } from '../../store/CertificationEnrollmentStore';
import { Enrollment } from '../../CertificationTypes';

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  reason: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const daysUntil = (dateString?: string) => {
  if (!dateString) return null;
  const diff = new Date(dateString).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ── Installment Progress Bar ──────────────────────────────────────────────────

function InstallmentBar({ paid, total = 3 }: { paid: number; total?: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all ${
            i < paid ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

// ── Installment Plan Card ─────────────────────────────────────────────────────

function InstallmentPlanCard({ enrollment }: { enrollment: Enrollment }) {
  const isFullyPaid = enrollment.paymentStatus === 'Paid';
  const total = 3;
  const totalAmount = enrollment.totalAmount > 100000 ? enrollment.totalAmount / 100 : enrollment.totalAmount;
  const amountPaid = enrollment.totalAmount > 100000 ? enrollment.amountPaid / 100 : enrollment.amountPaid;
  const installmentAmount = totalAmount / total;
  
  // Calculate paid installments based on actual amount paid
  const paid = Math.round(amountPaid / installmentAmount) || 0;
  const remaining = total - paid;
  
  const days = daysUntil(enrollment.nextInstallmentDue);

  let urgency: 'ok' | 'soon' | 'overdue' = 'ok';
  if (days !== null) {
    if (days < 0) urgency = 'overdue';
    else if (days <= 5) urgency = 'soon';
  }

  const urgencyStyles = {
    ok: 'text-slate-600 bg-slate-50 border-slate-200',
    soon: 'text-amber-700 bg-amber-50 border-amber-200',
    overdue: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{enrollment.certificationName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">3-Installment Plan · Enrolled {formatDate(enrollment.enrollmentDate)}</p>
          </div>
        </div>

        {isFullyPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 flex-shrink-0">
            <CheckCircle size={10} /> Fully Paid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-semibold text-amber-700 flex-shrink-0">
            <Clock size={10} /> Partial
          </span>
        )}
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-lg bg-slate-50 p-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Per Installment</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(installmentAmount)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">Amount Paid</p>
          <p className="text-sm font-bold text-emerald-700">{formatCurrency(amountPaid)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Total Course</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Installment Progress</span>
          <span className="text-[11px] font-semibold text-slate-700">{paid} of {total} paid</span>
        </div>
        <InstallmentBar paid={paid} total={total} />
        <div className="flex justify-between mt-1">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`text-[10px] font-medium ${i < paid ? 'text-emerald-600' : 'text-slate-400'}`}>
              #{i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Next due / remaining */}
      {!isFullyPaid && (
        <div className={`mt-2 rounded-lg border p-2 flex items-center gap-3 ${urgencyStyles[urgency]}`}>
          <Calendar size={15} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold">
              {urgency === 'overdue'
                ? `Overdue by ${Math.abs(days!)} day${Math.abs(days!) !== 1 ? 's' : ''}`
                : urgency === 'soon'
                ? `Due in ${days} day${days !== 1 ? 's' : ''}`
                : enrollment.nextInstallmentDue
                ? `Next due: ${formatDate(enrollment.nextInstallmentDue)}`
                : 'Next installment upcoming'}
            </p>
            <p className="text-[10px] opacity-75 mt-0.5">
              {remaining} installment{remaining !== 1 ? 's' : ''} remaining · {formatCurrency(installmentAmount)} each
            </p>
          </div>
          {urgency !== 'ok' && (
            <AlertCircle size={14} className="flex-shrink-0" />
          )}
        </div>
      )}
    </div>
  );
}

// ── Upcoming Payments Section ─────────────────────────────────────────────────

function UpcomingPayments({ enrollments }: { enrollments: Enrollment[] }) {
  const upcoming = enrollments
    .filter(
      (e) =>
        e.paymentPlan === 'installment' &&
        e.paymentStatus !== 'Paid' &&
        e.nextInstallmentDue
    )
    .sort(
      (a, b) =>
        new Date(a.nextInstallmentDue!).getTime() -
        new Date(b.nextInstallmentDue!).getTime()
    );

  if (upcoming.length === 0) return null;

  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Calendar size={15} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-amber-900">Upcoming Payments</h2>
          <p className="text-[11px] text-amber-700">{upcoming.length} installment{upcoming.length !== 1 ? 's' : ''} scheduled</p>
        </div>
      </div>

      <div className="space-y-2">
        {upcoming.map((e) => {
          const days = daysUntil(e.nextInstallmentDue);
          const isOverdue = days !== null && days < 0;
          const isSoon = days !== null && days >= 0 && days <= 5;
          const totalAmount = e.totalAmount > 100000 ? e.totalAmount / 100 : e.totalAmount;
          const amountPaid = e.totalAmount > 100000 ? e.amountPaid / 100 : e.amountPaid;
          const installmentAmount = totalAmount / 3;
          const paid = Math.round(amountPaid / installmentAmount) || 0;
          const installmentNum = paid + 1;

          return (
            <div
              key={e.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                isOverdue
                  ? 'border-red-200 bg-red-50'
                  : isSoon
                  ? 'border-amber-300 bg-amber-100'
                  : 'border-amber-200 bg-white'
              }`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isOverdue ? 'bg-red-100 text-red-600' : isSoon ? 'bg-amber-200 text-amber-700' : 'bg-amber-100 text-amber-600'
              }`}>
                {installmentNum}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{e.certificationName}</p>
                <p className="text-[11px] text-slate-500">
                  Installment {installmentNum}/3 · {formatCurrency(e.totalAmount > 100000 ? (e.totalAmount / 100) / 3 : e.totalAmount / 3)}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${isOverdue ? 'text-red-600' : isSoon ? 'text-amber-700' : 'text-slate-700'}`}>
                  {isOverdue
                    ? `${Math.abs(days!)}d overdue`
                    : days === 0
                    ? 'Due today'
                    : `${days}d left`}
                </p>
                <p className="text-[10px] text-slate-400">{formatDate(e.nextInstallmentDue!)}</p>
              </div>

              {isOverdue && (
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              )}
              {!isOverdue && isSoon && (
                <Clock size={14} className="text-amber-500 flex-shrink-0" />
              )}
              {!isOverdue && !isSoon && (
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { enrollments, syncEnrollments } = useEnrollmentStore();

  const installmentEnrollments = enrollments.filter(
    (e: Enrollment) => e.paymentPlan === 'installment'
  );

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await http.get('/v1/payments/history');
        if (response.data && response.data.success) {
          setPayments(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
    void syncEnrollments();
  }, [syncEnrollments]);

  const handleDownload = (payment: Payment) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(45, 65, 40);
    doc.text('MANAS360', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('PAYMENT RECEIPT', 105, 30, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text('Transaction ID:', 20, 50);
    doc.text(`${payment.id}`, 80, 50);

    doc.text('Date:', 20, 60);
    doc.text(`${formatDate(payment.date)}`, 80, 60);

    doc.text('Item:', 20, 70);
    doc.text(`${payment.reason}`, 80, 70);

    doc.text('Amount:', 20, 80);
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(payment.amount);
    doc.text(`${payment.currency || 'INR'} ${formattedNumber}`, 80, 80);

    doc.text('Status:', 20, 90);
    doc.setTextColor(16, 185, 129);
    doc.text(`${payment.status.toUpperCase()}`, 80, 90);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 105, 190, 105);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your payment!', 105, 115, { align: 'center' });

    doc.save(`receipt-${payment.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="mb-2 font-serif text-3xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-600">View your transaction history and upcoming installments.</p>
      </div>

      {/* ── Upcoming Payments Banner ── */}
      <UpcomingPayments enrollments={enrollments} />

      {/* ── Installment Plans ── */}
      {installmentEnrollments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-purple-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Installment Plans
              <span className="ml-1.5 text-slate-400 font-normal">({installmentEnrollments.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {installmentEnrollments.map((e: Enrollment) => (
              <InstallmentPlanCard key={e.id} enrollment={e} />
            ))}
          </div>
        </section>
      )}

      {/* ── Transaction History ── */}
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={16} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Transaction History</h2>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center flex flex-col items-center justify-center">
            <Loader2 size={32} className="mb-3 text-emerald-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <FileText size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="mb-4 text-sm font-medium text-slate-500">No payments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Transaction ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{payment.id}</td>
                    <td className="px-4 py-3">{formatDate(payment.date)}</td>
                    <td className="px-4 py-3">{payment.reason}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                          title="View Details"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleDownload(payment)}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                          title="Download Receipt"
                        >
                          <Download size={14} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* ── Payment Details Modal ── */}
      {selectedPayment &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] h-screen w-screen flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedPayment(null)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="font-semibold text-slate-900">Payment Details</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <span className="sr-only">Close</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </h4>
                  <p className="mt-1 text-sm font-medium text-emerald-600">Payment Successful</p>
                </div>

                <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-medium text-slate-900">{selectedPayment.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium text-slate-900">{formatDate(selectedPayment.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Item</span>
                    <span className="font-medium text-slate-900">{selectedPayment.reason}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-emerald-600">{selectedPayment.status}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(selectedPayment)}
                  className="flex items-center gap-2 rounded-lg bg-[#4A6741] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d5736] transition"
                >
                  <Download size={16} /> Download Receipt
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PaymentHistory;
