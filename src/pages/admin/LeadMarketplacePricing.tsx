import { useEffect, useState } from 'react';
import { getPlatformConfig, upsertPlatformConfig, type PlatformConfigRecord } from '../../api/admin.api';
import { toast } from 'sonner';
import { usePermission } from '../../hooks/usePermission';

const CONFIG_KEY = 'lead_marketplace_prices';

const DEFAULT_PRICES = { hot: 299, warm: 199, cold: 99 };

type TierKey = 'hot' | 'warm' | 'cold';

const TIER_META: Record<TierKey, { label: string; emoji: string; accent: string }> = {
  hot: { label: 'Hot Lead', emoji: '🔥', accent: 'border-red-200 bg-red-50' },
  warm: { label: 'Warm Lead', emoji: '🌟', accent: 'border-amber-200 bg-amber-50' },
  cold: { label: 'Cold Lead', emoji: '❄️', accent: 'border-blue-200 bg-blue-50' },
};

export default function LeadMarketplacePricingPage() {
  const { isReady, canPolicy } = usePermission();
  const canView = canPolicy('config.view');
  const canManage = canPolicy('config.manage');

  const [record, setRecord] = useState<PlatformConfigRecord | null>(null);
  const [prices, setPrices] = useState<Record<TierKey, string>>({
    hot: String(DEFAULT_PRICES.hot),
    warm: String(DEFAULT_PRICES.warm),
    cold: String(DEFAULT_PRICES.cold),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    if (!isReady || !canView) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getPlatformConfig(CONFIG_KEY);
      const value = (response.data?.value || {}) as Partial<Record<TierKey, number>>;
      setRecord(response.data);
      setPrices({
        hot: String(value.hot ?? DEFAULT_PRICES.hot),
        warm: String(value.warm ?? DEFAULT_PRICES.warm),
        cold: String(value.cold ?? DEFAULT_PRICES.cold),
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // No config saved yet — show defaults, treated as a new key on save.
        setRecord(null);
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load lead marketplace pricing.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    void loadConfig();
  }, [isReady, canView]);

  const handleChange = (tier: TierKey, value: string) => {
    setPrices((prev) => ({ ...prev, [tier]: value }));
  };

  const handleSave = async () => {
    if (!canManage) {
      toast.error('You do not have permission to manage lead marketplace pricing.');
      return;
    }

    const parsed: Record<TierKey, number> = { hot: 0, warm: 0, cold: 0 };
    for (const tier of Object.keys(prices) as TierKey[]) {
      const num = Number(prices[tier]);
      if (!Number.isFinite(num) || num < 0) {
        toast.error(`${TIER_META[tier].label} price must be a non-negative number.`);
        return;
      }
      parsed[tier] = Math.round(num);
    }

    setSaving(true);
    try {
      const response = await upsertPlatformConfig(CONFIG_KEY, {
        value: parsed,
        expectedVersion: record?.version ?? 0,
      });
      setRecord(response.data);
      toast.success('Marketplace lead pricing saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="font-display text-xl font-bold text-ink-800">Marketplace Lead Pricing</h2>
        <p className="mt-1 text-sm text-ink-600">
          Set the base price providers pay for Hot, Warm, and Cold marketplace leads. These prices show on the
          provider subscription page and on lead cards in the lead marketplace.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {!isReady ? null : !canView ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          You do not have permission to view this configuration.
        </div>
      ) : null}

      <div className={`rounded-xl border border-ink-100 bg-white p-5 ${!canView ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(Object.keys(TIER_META) as TierKey[]).map((tier) => {
            const meta = TIER_META[tier];
            return (
              <div key={tier} className={`rounded-xl border p-4 ${meta.accent}`}>
                <p className="text-sm font-bold text-ink-800">
                  {meta.emoji} {meta.label}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-lg font-black text-ink-800">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={prices[tier]}
                    onChange={(event) => handleChange(tier, event.target.value)}
                    className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-lg font-bold text-ink-800 outline-none focus:border-ink-300"
                    disabled={!canManage || loading}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-ink-500">
            {record ? `Version ${record.version} · Updated ${new Date(record.updatedAt).toLocaleString('en-IN')}` : 'No saved pricing yet — defaults shown.'}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !canManage}
            className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Pricing'}
          </button>
        </div>
      </div>
    </div>
  );
}
