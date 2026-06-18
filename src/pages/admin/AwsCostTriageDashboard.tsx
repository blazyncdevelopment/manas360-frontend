import { useMemo, useState, useEffect } from 'react';
import { getAwsCostTriageData, AwsCostTriageData } from '../../api/admin.api';

type ResourceStatus = 'safe' | 'danger' | 'warn' | 'off';
type CostType = 'free' | 'paid' | 'waste';

type ResourceCard = {
  id: string;
  icon: string;
  name: string;
  status: ResourceStatus;
  statusLabel: string;
  costType: CostType;
  costLabel: string;
};

const checklist = [
  {
    title: 'Review Triage Report',
    items: [
      'Check email/Slack for triage report',
      'Review critical flags — act TODAY',
      'Open AWS Billing and compare vs ₹10K budget',
    ],
  },
  {
    title: 'Kill Zombie Resources',
    items: [
      'Stop unused EC2 instances',
      'Delete NAT Gateways (if any)',
      'Release unattached Elastic IPs',
    ],
  },
  {
    title: 'Governance',
    items: [
      'Tag all resources (Project, Environment, Owner)',
      'Verify no banned services were provisioned',
      'Ensure dev instances have AutoStop tags',
    ],
  },
  {
    title: 'Forward Look',
    items: [
      'Confirm month-end projection under ₹10K',
      'Review free tier usage limits',
      'Capture billing screenshot for records',
    ],
  },
];

export default function AwsCostTriageDashboard() {
  const [awsData, setAwsData] = useState<AwsCostTriageData | null>(null);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('scanning');
  const [lastScan, setLastScan] = useState<string>('Never');
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const fetchTriageData = async () => {
    setScanState('scanning');
    try {
      const data = await getAwsCostTriageData();
      setAwsData(data);
      setLastScan(
        `Last scan: ${new Date().toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`
      );
      setScanState('done');
      window.setTimeout(() => setScanState('idle'), 2000);
    } catch (error) {
      console.error('Failed to fetch AWS triage data:', error);
      setScanState('idle');
    }
  };

  useEffect(() => {
    fetchTriageData();
  }, []);

  const resources: ResourceCard[] = useMemo(() => {
    if (!awsData) return [];

    const { resources: r } = awsData;

    return [
      {
        id: 'ec2',
        icon: '🖥️',
        name: 'EC2 Instances',
        status: r.ec2RunningCount > 0 ? 'danger' : r.ec2Count > 0 ? 'warn' : 'safe',
        statusLabel: `${r.ec2RunningCount} running / ${r.ec2Count} total`,
        costType: r.ec2RunningCount > 0 ? 'waste' : 'paid',
        costLabel: r.ec2RunningCount > 0 ? 'Potential Waste!' : 'Variable',
      },
      {
        id: 'rds',
        icon: '🗄️',
        name: 'RDS Databases',
        status: r.rdsCount > 0 ? 'warn' : 'safe',
        statusLabel: `${r.rdsCount} found`,
        costType: r.rdsCount > 0 ? 'paid' : 'free',
        costLabel: r.rdsCount > 0 ? 'Review size' : '₹0',
      },
      {
        id: 'nat',
        icon: '🌐',
        name: 'NAT Gateway',
        status: r.natCount > 0 ? 'danger' : 'safe',
        statusLabel: `${r.natCount} ACTIVE`,
        costType: r.natCount > 0 ? 'waste' : 'free',
        costLabel: r.natCount > 0 ? '₹3,500+/mo each!' : '₹0',
      },
      {
        id: 'eip',
        icon: '📍',
        name: 'Elastic IPs',
        status: r.eipUnattachedCount > 0 ? 'danger' : 'safe',
        statusLabel: `${r.eipUnattachedCount} unattached`,
        costType: r.eipUnattachedCount > 0 ? 'waste' : 'free',
        costLabel: r.eipUnattachedCount > 0 ? '₹740/mo waste' : '₹0',
      },
      {
        id: 'elb',
        icon: '⚖️',
        name: 'Load Balancers',
        status: r.elbCount > 0 ? 'warn' : 'safe',
        statusLabel: `${r.elbCount} found`,
        costType: r.elbCount > 0 ? 'paid' : 'free',
        costLabel: r.elbCount > 0 ? 'Check usage' : '₹0',
      },
      {
        id: 'eks',
        icon: '☸️',
        name: 'EKS Clusters',
        status: r.eksCount > 0 ? 'danger' : 'safe',
        statusLabel: `${r.eksCount} found`,
        costType: r.eksCount > 0 ? 'waste' : 'free',
        costLabel: r.eksCount > 0 ? '₹30k/mo base fee!' : '₹0 saved',
      },
      {
        id: 'lightsail',
        icon: '💡',
        name: 'Lightsail',
        status: r.lightsailCount > 0 ? 'safe' : 'off',
        statusLabel: `${r.lightsailCount} instance(s)`,
        costType: r.lightsailCount > 0 ? 'paid' : 'free',
        costLabel: r.lightsailCount > 0 ? 'Predictable' : '₹0',
      },
      {
        id: 's3',
        icon: '📦',
        name: 'S3 Buckets',
        status: r.s3BucketCount > 0 ? 'safe' : 'safe',
        statusLabel: `${r.s3BucketCount} buckets`,
        costType: r.s3BucketCount > 0 ? 'paid' : 'free',
        costLabel: 'Cheap',
      },
    ];
  }, [awsData]);

  const redCount = useMemo(() => resources.filter((r) => r.status === 'danger').length, [resources]);
  const yellowCount = useMemo(() => resources.filter((r) => r.status === 'warn').length, [resources]);

  const alert = useMemo(() => {
    if (!awsData) return { className: 'border-slate-500/20 bg-slate-500/10 text-slate-300', icon: '⏳', text: 'Scanning AWS...' };
    if (redCount === 0 && yellowCount === 0) {
      return { className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300', icon: '✅', text: 'All clear! No zombie resources detected. Infrastructure is cost-efficient.' };
    }
    if (redCount === 0) {
      return { className: 'border-amber-500/20 bg-amber-500/10 text-amber-300', icon: '⚠️', text: `${yellowCount} warning(s) remaining. Review and resolve this week.` };
    }
    return { className: 'border-rose-500/30 bg-rose-500/10 text-rose-300', icon: '🚨', text: `${redCount} critical resources running! Immediate action required to prevent billing surprises.` };
  }, [awsData, redCount, yellowCount]);

  const statusClass = (status: ResourceStatus) => {
    if (status === 'danger') return 'text-rose-400';
    if (status === 'warn') return 'text-amber-300';
    if (status === 'safe') return 'text-emerald-300';
    return 'text-slate-400';
  };

  const costClass = (costType: CostType) => {
    if (costType === 'waste') return 'border border-rose-400/25 bg-rose-500/10 text-rose-300';
    if (costType === 'paid') return 'border border-orange-400/25 bg-orange-500/10 text-orange-200';
    return 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-300';
  };

  const currentSpend = awsData?.metrics.currentSpend || 0;
  const projectedSpend = awsData?.metrics.projectedSpend || 0;
  const budget = 10000;
  const percentUsed = Math.min(Math.round((currentSpend / budget) * 100), 100);
  const projectedPercent = Math.min(Math.round((projectedSpend / budget) * 100), 100);

  return (
    <div className="min-h-full bg-[#07080c] text-slate-100">
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0d1017] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 font-mono text-sm font-bold text-white">₹</div>
            <div>
              <h2 className="text-base font-semibold tracking-wide">AWS Cost Triage</h2>
              <p className="text-xs text-slate-400">Live API Connection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400">{lastScan}</span>
            <button
              type="button"
              onClick={fetchTriageData}
              disabled={scanState === 'scanning'}
              className="rounded-md border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
            >
              {scanState === 'scanning' ? 'Scanning API...' : scanState === 'done' ? 'Scan Complete' : 'Run Triage'}
            </button>
          </div>
        </section>

        <section className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${alert.className}`}>
          <span className="text-lg">{alert.icon}</span>
          <p>{alert.text}</p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0d1017] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Current Month Spend</p>
            <p className="mt-2 font-mono text-3xl font-bold text-amber-300">
              {currentSpend === 0 ? 'Pending CE' : `₹${currentSpend.toLocaleString('en-IN')}`}
            </p>
            <p className="mt-1 text-xs text-slate-400">Current cycle · {percentUsed}% of budget used</p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-black/40"><div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400" style={{ width: `${percentUsed}%`}} /></div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0d1017] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Projected Month-End</p>
            <p className={`mt-2 font-mono text-3xl font-bold ${projectedSpend > budget ? 'text-rose-400' : 'text-emerald-400'}`}>
              {projectedSpend === 0 ? 'Pending CE' : `₹${projectedSpend.toLocaleString('en-IN')}`}
            </p>
            <p className="mt-1 text-xs text-slate-400">Estimated based on current burn rate</p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-black/40"><div className="h-full bg-gradient-to-r from-amber-400 to-rose-400" style={{ width: `${projectedPercent}%`}} /></div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0d1017] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Monthly Budget Target</p>
            <p className="mt-2 font-mono text-3xl font-bold text-emerald-400">₹{budget.toLocaleString('en-IN')}</p>
            <p className="mt-1 text-xs text-slate-400">Target safe limit</p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-black/40"><div className="h-full w-full bg-emerald-400" /></div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {!awsData ? (
            <div className="col-span-full py-12 text-center text-slate-500 animate-pulse">Connecting to AWS API...</div>
          ) : (
            resources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-xl border border-slate-800 bg-[#0d1017] p-4 text-left transition hover:border-slate-600 hover:bg-[#111820]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">{resource.icon}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${resource.status === 'danger' ? 'bg-rose-500' : resource.status === 'warn' ? 'bg-amber-400' : resource.status === 'safe' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                </div>
                <p className="text-sm font-semibold">{resource.name}</p>
                <p className={`mt-1 text-xs ${statusClass(resource.status)}`}>{resource.statusLabel}</p>
                <span className={`mt-2 inline-block rounded px-2 py-1 text-[11px] ${costClass(resource.costType)}`}>{resource.costLabel}</span>
              </div>
            ))
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
          <div className="rounded-xl border border-slate-800 bg-[#0d1017]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Banned Services (MVP)</h3>
              <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-[10px] text-slate-400">Never provision</span>
            </div>
            <div className="space-y-1 px-4 py-3 text-sm">
              {[
                ['EKS Cluster', '₹30,000/mo', 'Docker Compose'],
                ['NAT Gateway', '₹3,500+/mo', 'Public subnet'],
                ['Multi-AZ RDS', '2x DB cost', 'Daily snapshots'],
                ['ElastiCache (dedicated)', '₹4,400+/mo', 'Redis on Lightsail'],
                ['AWS WAF', '₹500+/mo', 'Cloudflare free'],
                ['Secrets Manager', '₹35/secret', '.env + Lightsail'],
              ].map(([name, cost, alt]) => (
                <div key={name} className="grid grid-cols-[1fr,auto,auto] gap-3 border-b border-slate-800 py-2 last:border-b-0">
                  <span className="text-slate-200">{name}</span>
                  <span className="font-mono text-xs text-rose-400">{cost}</span>
                  <span className="text-xs text-emerald-300">{alt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1017]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Approved Cost Structure</h3>
              <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-[10px] text-slate-400">Scaling path</span>
            </div>
            <div className="space-y-3 px-4 py-3 text-sm">
              {[
                ['Pre-Launch (Now)', '₹1,500/mo', 'Lightsail 2GB + self-hosted DB + Redis'],
                ['MVP Launch (100 users)', '₹7,700/mo', 'Lightsail 4GB + managed DB + storage + LB'],
                ['Growth (500 users)', '₹9,200/mo', 'Add staging instance for blue-green deploys'],
                ['Scale (2K+ users)', '₹24,000/mo', 'EC2 + RDS + ElastiCache + ALB'],
              ].map(([name, total, desc], idx) => (
                <div key={name} className={`rounded-lg border p-3 ${idx === 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-800 bg-[#111820]'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-100">{name}</p>
                    <p className="font-mono text-xs text-slate-200">{total}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#0d1017] p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded border border-orange-400/30 bg-orange-500/10 px-2 py-1 font-mono text-xs tracking-wider text-orange-300">MON 9:00 AM</span>
            <h3 className="text-sm font-semibold">Weekly Cost Review Checklist</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {checklist.map((group) => (
              <div key={group.title} className="rounded-lg border border-slate-800 bg-[#111820] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{group.title}</p>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const key = `${group.title}:${item}`;
                    const checked = Boolean(checkedMap[key]);
                    return (
                      <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setCheckedMap((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-400"
                        />
                        <span className={checked ? 'text-slate-500 line-through' : ''}>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
