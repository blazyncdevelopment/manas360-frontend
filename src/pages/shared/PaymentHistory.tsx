import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { http } from '../../lib/http';

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  reason: string;
};

export const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await http.get('/v1/payments/history');
        if (response.data && response.data.success) {
          setPayments(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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

  const handleDownload = (payment: Payment) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(45, 65, 40); // Dark green matching MANAS360 theme
    doc.text('MANAS360', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('PAYMENT RECEIPT', 105, 30, { align: 'center' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // Details
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Transaction ID:`, 20, 50);
    doc.text(`${payment.id}`, 80, 50);

    doc.text(`Date:`, 20, 60);
    doc.text(`${formatDate(payment.date)}`, 80, 60);

    doc.text(`Item:`, 20, 70);
    doc.text(`${payment.reason}`, 80, 70);

    doc.text(`Amount:`, 20, 80);
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(payment.amount);
    doc.text(`${payment.currency || 'INR'} ${formattedNumber}`, 80, 80);

    doc.text(`Status:`, 20, 90);
    doc.setTextColor(16, 185, 129); // Emerald 500 for status
    doc.text(`${payment.status.toUpperCase()}`, 80, 90);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 105, 190, 105);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your payment!', 105, 115, { align: 'center' });

    // Download PDF
    doc.save(`receipt-${payment.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="mb-2 font-serif text-3xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-600">View and download your payment receipts.</p>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
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
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(payment.amount, payment.currency)}</td>
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

      {/* Payment Details Modal */}
      {selectedPayment && createPortal(
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                </div>
                <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</h4>
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
