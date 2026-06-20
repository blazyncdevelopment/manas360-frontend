import { useState, useMemo } from 'react';
import { X, ShoppingCart, Minus, Plus } from 'lucide-react';
import { type ProviderLeadPlanId } from '../../lib/providerSubscriptionFlow';
import type { LeadMarketplacePricing } from '../../api/provider';

interface PurchaseAddonLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricing: LeadMarketplacePricing;
  currentPlanId: ProviderLeadPlanId;
  onProceedToPay: (quantities: { hot: number; warm: number; cold: number }, totalAmountMinor: number) => void;
  isProcessing: boolean;
}

export default function PurchaseAddonLeadsModal({
  isOpen,
  onClose,
  pricing,
  currentPlanId,
  onProceedToPay,
  isProcessing
}: PurchaseAddonLeadsModalProps) {
  const [quantities, setQuantities] = useState({ hot: 0, warm: 0, cold: 0 });

  const discountPercentage = useMemo(() => {
    if (currentPlanId === 'premium') return 20;
    if (currentPlanId === 'standard') return 10;
    return 0;
  }, [currentPlanId]);

  const invoice = useMemo(() => {
    const subtotal = 
      (quantities.hot * pricing.hot) + 
      (quantities.warm * pricing.warm) + 
      (quantities.cold * pricing.cold);
    
    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = taxableAmount * 0.18;
    const totalAmount = taxableAmount + gstAmount;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      totalAmount,
      totalAmountMinor: Math.round(totalAmount * 100)
    };
  }, [quantities, pricing, discountPercentage]);

  if (!isOpen) return null;

  const handleUpdateQuantity = (type: 'hot' | 'warm' | 'cold', delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const totalLeads = quantities.hot + quantities.warm + quantities.cold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!isProcessing ? onClose : undefined} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#1f6f5f]" />
            Purchase Add-on Leads
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quantity Selectors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-black text-slate-900">Hot Leads</p>
                  <p className="text-xs font-bold text-slate-500">₹{pricing.hot}/each</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl border border-red-100 p-1">
                <button onClick={() => handleUpdateQuantity('hot', -1)} disabled={quantities.hot === 0} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-black text-slate-900">{quantities.hot}</span>
                <button onClick={() => handleUpdateQuantity('hot', 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌟</span>
                <div>
                  <p className="text-sm font-black text-slate-900">Warm Leads</p>
                  <p className="text-xs font-bold text-slate-500">₹{pricing.warm}/each</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl border border-amber-100 p-1">
                <button onClick={() => handleUpdateQuantity('warm', -1)} disabled={quantities.warm === 0} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-black text-slate-900">{quantities.warm}</span>
                <button onClick={() => handleUpdateQuantity('warm', 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">❄️</span>
                <div>
                  <p className="text-sm font-black text-slate-900">Cold Leads</p>
                  <p className="text-xs font-bold text-slate-500">₹{pricing.cold}/each</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl border border-blue-100 p-1">
                <button onClick={() => handleUpdateQuantity('cold', -1)} disabled={quantities.cold === 0} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-black text-slate-900">{quantities.cold}</span>
                <button onClick={() => handleUpdateQuantity('cold', 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">Invoice Summary</h3>
            
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal ({totalLeads} leads)</span>
              <span className="font-bold text-slate-900">₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            
            {discountPercentage > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Plan Discount ({discountPercentage}%)</span>
                <span className="font-bold">-₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm text-slate-600">
              <span>Taxable Amount</span>
              <span className="font-bold text-slate-900">₹{invoice.taxableAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-slate-600">
              <span>GST (18%)</span>
              <span className="font-bold text-slate-900">₹{invoice.gstAmount.toFixed(2)}</span>
            </div>
            
            <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
              <span className="text-base font-black text-slate-900">Total Payable</span>
              <span className="text-2xl font-black text-[#1f6f5f]">₹{invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50/50">
          <button
            onClick={() => onProceedToPay(quantities, invoice.totalAmountMinor)}
            disabled={totalLeads === 0 || isProcessing}
            className="w-full rounded-2xl bg-[#1f6f5f] py-4 text-sm font-black text-white hover:bg-[#145347] shadow-xl shadow-[#1f6f5f]/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>Proceed to Pay ₹{invoice.totalAmount.toFixed(2)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
