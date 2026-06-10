import { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Brain,
  Zap,
  Heart,
  Activity,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart2,
  Moon,
  Sun,
  Wind,
  RefreshCw,
  ChevronRight,
  Star,
} from 'lucide-react';
import { patientApi } from '../../api/patient';
import { getClinicalAssessmentSummary, inferClinicalAssessmentType } from '../../utils/clinicalAssessments';

type ProgressTab = 'mood' | 'clinical' | 'habits';
type ClinicalFilter = 'all' | 'phq' | 'gad';
type TimeRangeFilter = '1m' | '3m' | '6m' | '1y';

const asPayload = <T,>(value: any): T => (value?.data ?? value) as T;

const moodLabelMap: Record<number, string> = {
  1: 'Awful',
  2: 'Sad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

const moodEmojiMap: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const tabs: Array<{ key: ProgressTab; label: string; icon: React.ReactNode }> = [
  { key: 'mood', label: 'Mood & Wellness', icon: <Heart className="h-4 w-4" /> },
  { key: 'clinical', label: 'Clinical Scores', icon: <Brain className="h-4 w-4" /> },
  { key: 'habits', label: 'Habits & Effort', icon: <Target className="h-4 w-4" /> },
];

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDay = (value: unknown) => {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getActiveTab = (raw: string | null): ProgressTab => {
  if (raw === 'clinical') return 'clinical';
  if (raw === 'habits') return 'habits';
  return 'mood';
};

const startOfWeek = (date: Date) => {
  const cloned = new Date(date);
  const day = cloned.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cloned.setDate(cloned.getDate() + diff);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
};

const weekKey = (date: Date) => {
  const weekStart = startOfWeek(date);
  return `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
};

const parseSleepHours = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value || '').trim();
  if (!text) return null;
  if (text === '<4') return 3;
  if (text === '4-6' || text === '4–6') return 5;
  if (text === '6-8' || text === '6–8') return 7;
  if (text === '8+') return 8.5;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
};

const energyToScore = (value?: string): number => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'high') return 20;
  if (normalized === 'medium') return 14;
  if (normalized === 'low') return 8;
  return 12;
};

const sleepToScore = (hours: number | null): number => {
  if (hours === null) return 10;
  if (hours >= 6 && hours <= 8) return 20;
  if (hours >= 5 && hours < 6) return 15;
  if (hours > 8) return 14;
  if (hours >= 4 && hours < 5) return 10;
  return 4;
};

const stressToScore = (value?: number): number => {
  if (!Number.isFinite(value)) return 10;
  const clamped = Math.max(1, Math.min(10, Number(value)));
  return Math.round(((10 - clamped) / 9) * 20);
};

const wellnessBand = (score: number) => {
  if (score >= 80) return { label: 'Strong momentum', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (score >= 65) return { label: 'Doing fairly well', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700' };
  if (score >= 50) return { label: 'Needs gentle support', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' };
  return { label: 'High support recommended', color: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700' };
};

// ── Shimmer skeleton component ──────────────────────────────────
function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gradient-to-r from-[#edf2ef] via-[#f5f9f7] to-[#edf2ef] bg-[length:400%_100%] ${className}`}
      style={{ animation: 'shimmer 1.8s ease-in-out infinite', backgroundSize: '400% 100%' }} />
  );
}

function MoodTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Shimmer className="h-32 rounded-2xl lg:col-span-2" />
        <Shimmer className="h-32 rounded-2xl" />
      </div>
      <Shimmer className="h-80 rounded-2xl" />
    </div>
  );
}

// ── Metric card ──────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  helper,
  icon,
  highlight = false,
  trend,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'flat';
}) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-charcoal/40';

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-soft-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-md ${highlight
        ? 'border-calm-sage/30 bg-gradient-to-br from-[#edf4f1] to-[#f2f9f6]'
        : 'border-ink-100 bg-white'
        }`}
    >
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-calm-sage/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-calm-sage/8" />
      <div className="relative">
        <div className="flex items-center gap-2">
          {icon && <span className="text-calm-sage">{icon}</span>}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/45">{label}</p>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-3xl font-bold text-charcoal">{value}</p>
          {trendIcon && <span className={`mb-1 text-sm font-semibold ${trendColor}`}>{trendIcon}</span>}
        </div>
        <p className="mt-1 text-xs text-charcoal/55">{helper}</p>
      </div>
    </article>
  );
}

// ── Custom tooltip ───────────────────────────────────────────────
function MoodTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload || {};
  const mood = Math.round(point.mood);
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3 text-xs shadow-soft-md">
      <p className="font-semibold text-charcoal">{label}</p>
      <p className="mt-1 text-2xl">{moodEmojiMap[mood] || ''}</p>
      <p className="mt-0.5 text-charcoal/75">Mood: <span className="font-semibold">{moodLabelMap[mood] || mood}</span></p>
      {point.tagsLabel && point.tagsLabel !== 'None' && (
        <p className="text-charcoal/65">Context: {point.tagsLabel}</p>
      )}
    </div>
  );
}

function ClinicalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3 text-xs shadow-soft-md">
      <p className="font-semibold text-charcoal mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4f1] text-calm-sage">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-charcoal">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-charcoal/60">{body}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-calm-sage px-5 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition hover:bg-calm-sage/90 hover:-translate-y-0.5"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ── Severity badge ───────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  const cfg =
    s.includes('severe')
      ? 'bg-rose-100 text-rose-700'
      : s.includes('moderate')
        ? 'bg-amber-100 text-amber-700'
        : s.includes('mild')
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-emerald-100 text-emerald-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cfg}`}>
      {severity}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getActiveTab(searchParams.get('tab'));
  const clinicalFilter = (searchParams.get('clinicalType') || 'all') as ClinicalFilter;
  const timeRange = (searchParams.get('timeRange') || '3m') as TimeRangeFilter;
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(t);
  }, [activeTab]);

  // ── Mood query ───────────────────────────────────────────────
  const moodQuery = useQuery(
    ['my-progress', 'mood'],
    async () => {
      const [historyRes, statsRes] = await Promise.all([
        patientApi.getMoodHistory().catch(() => []),
        patientApi.getMoodStats().catch(() => null),
      ]);
      return {
        history: asPayload<any[]>(historyRes) || [],
        stats: asPayload<any>(statsRes) || {},
      };
    },
    { refetchOnMount: true, staleTime: 1000 * 60 * 5 },
  );

  // ── Clinical query ───────────────────────────────────────────
  const clinicalQuery = useQuery(
    ['my-progress', 'clinical'],
    async () => {
      const [historyRes, insightsRes, progressRes] = await Promise.all([
        patientApi.getStructuredAssessmentHistory().catch(() => []),
        patientApi.getInsights().catch(() => null),
        patientApi.getProgress().catch(() => null),
      ]);
      const structuredPayload = asPayload<any>(historyRes) || {};
      const structuredItems = Array.isArray(structuredPayload)
        ? structuredPayload
        : Array.isArray(structuredPayload?.items)
          ? structuredPayload.items
          : [];
      return {
        structured: structuredItems,
        insights: asPayload<any>(insightsRes) || {},
        progress: asPayload<any>(progressRes) || {},
      };
    },
    {
      enabled: activeTab === 'clinical',
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
    },
  );

  // ── Habits query ─────────────────────────────────────────────
  const habitsQuery = useQuery(
    ['my-progress', 'habits'],
    async () => {
      const [progressRes, sessionsRes, exercisesRes, moodHistoryRes] = await Promise.all([
        patientApi.getProgress().catch(() => null),
        patientApi.getSessionHistory().catch(() => []),
        patientApi.getExercises().catch(() => []),
        patientApi.getMoodHistory().catch(() => []),
      ]);
      return {
        progress: asPayload<any>(progressRes) || {},
        sessions: asPayload<any[]>(sessionsRes) || [],
        exercises: asPayload<any[]>(exercisesRes) || [],
        moodHistory: asPayload<any[]>(moodHistoryRes) || [],
      };
    },
    { enabled: activeTab === 'habits' },
  );

  // ── Mood derived data ────────────────────────────────────────
  const moodHistory = useMemo(() => {
    const rows = Array.isArray(moodQuery.data?.history) ? moodQuery.data?.history : [];
    return rows
      .map((entry: any) => {
        const date = parseDate(entry?.createdAt || entry?.created_at || entry?.date);
        if (!date) return null;
        const mood = Number(entry?.mood || 0);
        const metadata = entry?.metadata || {};
        const tags = Array.isArray(metadata?.tags)
          ? metadata.tags
          : Array.isArray(metadata?.context)
            ? metadata.context
            : [];
        const sleepHours = parseSleepHours(metadata?.sleepHours ?? metadata?.sleep ?? entry?.sleepHours ?? entry?.sleep);
        const stressCandidate = metadata?.stressLevel ?? metadata?.stress ?? entry?.stressLevel;
        const stressLevel = Number.isFinite(Number(stressCandidate)) ? Number(stressCandidate) : undefined;
        return { date, mood, tags, energy: metadata?.energy, sleepHours, stressLevel };
      })
      .filter(Boolean) as Array<{
        date: Date;
        mood: number;
        tags: string[];
        energy?: string;
        sleepHours?: number | null;
        stressLevel?: number;
      }>;
  }, [moodQuery.data?.history]);

  const moodChartData = useMemo(() => {
    return moodHistory
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-14)
      .map((item) => ({
        dateLabel: item.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        mood: item.mood,
        tagsLabel: item.tags.length ? item.tags.join(', ') : 'None',
      }));
  }, [moodHistory]);

  const weeklyAverageMood = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const rows = moodHistory.filter((item) => item.date >= cutoff);
    if (!rows.length) return null;
    return Number((rows.reduce((sum, item) => sum + item.mood, 0) / rows.length).toFixed(1));
  }, [moodHistory]);

  const topEmotion = useMemo(() => {
    const frequency: Record<string, number> = {};
    for (const item of moodHistory) {
      const moodName = moodLabelMap[item.mood] || 'Unrated';
      frequency[moodName] = (frequency[moodName] || 0) + 1;
    }
    const winner = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0];
    return winner?.[0] || null;
  }, [moodHistory]);

  const topTrigger = useMemo(() => {
    const frequency: Record<string, number> = {};
    for (const item of moodHistory) {
      for (const tag of item.tags) {
        const normalized = String(tag || '').trim();
        if (!normalized) continue;
        frequency[normalized] = (frequency[normalized] || 0) + 1;
      }
    }
    const winner = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0];
    return winner?.[0] || null;
  }, [moodHistory]);

  const aiMoodInsight = useMemo(() => {
    const statsInsights = Array.isArray(moodQuery.data?.stats?.insights) ? moodQuery.data?.stats?.insights : [];
    if (statsInsights.length) return statsInsights[0];
    if (moodChartData.length < 3)
      return 'Keep checking in daily. Your recovery story becomes clearer as we gather more trend points.';
    const minPoint = moodChartData.reduce((acc, row) => (row.mood < acc.mood ? row : acc), moodChartData[0]);
    const maxPoint = moodChartData.reduce((acc, row) => (row.mood > acc.mood ? row : acc), moodChartData[0]);
    return `Your recent low appeared on ${minPoint.dateLabel}, while your strongest day was ${maxPoint.dateLabel}. Keep using Daily Check-in to stabilize the week.`;
  }, [moodChartData, moodQuery.data?.stats?.insights]);

  const weeklyMoodSummary = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const rows = moodHistory.filter((item) => item.date >= cutoff);
    const good = rows.filter((item) => item.mood >= 4).length;
    const neutral = rows.filter((item) => item.mood === 3).length;
    const difficult = rows.filter((item) => item.mood > 0 && item.mood <= 2).length;

    const byDay: Record<string, { label: string; total: number; count: number }> = {};
    for (const row of rows) {
      const key = row.date.toISOString().slice(0, 10);
      if (!byDay[key]) {
        byDay[key] = { label: row.date.toLocaleDateString(undefined, { weekday: 'short' }), total: 0, count: 0 };
      }
      byDay[key].total += row.mood;
      byDay[key].count += 1;
    }
    const graph = Object.values(byDay)
      .map((entry) => ({ day: entry.label, mood: entry.count ? Number((entry.total / entry.count).toFixed(1)) : 0 }))
      .slice(-7);
    return { good, neutral, difficult, graph };
  }, [moodHistory]);

  const moodPatternInsight = useMemo(() => {
    if (!moodHistory.length) {
      return {
        title: 'Weekly Insight',
        body: 'Log more check-ins to unlock personalized pattern detection.',
        recommendation: 'Try morning and evening check-ins for 7 days.',
      };
    }
    const withSleep = moodHistory.filter((item) => Number(item.sleepHours) > 0);
    if (withSleep.length >= 3) {
      const goodSleep = withSleep.filter((item) => Number(item.sleepHours) >= 6).map((item) => item.mood);
      const lowSleep = withSleep.filter((item) => Number(item.sleepHours) < 6).map((item) => item.mood);
      const avgGoodSleep = goodSleep.length ? goodSleep.reduce((s, v) => s + v, 0) / goodSleep.length : 0;
      const avgLowSleep = lowSleep.length ? lowSleep.reduce((s, v) => s + v, 0) / lowSleep.length : 0;
      if (goodSleep.length && lowSleep.length && avgGoodSleep - avgLowSleep >= 0.5) {
        return {
          title: 'Sleep & Mood Pattern',
          body: 'Your mood is higher on days when sleep is at least 6 hours.',
          recommendation: 'Try maintaining a consistent sleep window this week.',
        };
      }
    }
    const weekdayStats: Record<string, { total: number; count: number }> = {};
    for (const row of moodHistory) {
      const weekday = row.date.toLocaleDateString(undefined, { weekday: 'long' });
      if (!weekdayStats[weekday]) weekdayStats[weekday] = { total: 0, count: 0 };
      weekdayStats[weekday].total += row.mood;
      weekdayStats[weekday].count += 1;
    }
    const weekdayAverages = Object.entries(weekdayStats)
      .map(([day, data]) => ({ day, avg: data.total / data.count }))
      .sort((a, b) => a.avg - b.avg);
    if (weekdayAverages.length >= 2) {
      const lowest = weekdayAverages[0];
      return {
        title: 'Weekly Pattern',
        body: `Your mood tends to dip on ${lowest.day}s compared to other days.`,
        recommendation: `Plan a lighter schedule and one calming routine on ${lowest.day}s.`,
      };
    }
    return {
      title: 'Weekly Insight',
      body: 'Your trends are stabilizing with regular check-ins.',
      recommendation: 'Keep adding context tags to make insights more accurate.',
    };
  }, [moodHistory]);

  const moodContextHeatmap = useMemo(() => {
    const frequency: Record<string, number> = {};
    const moodTotals: Record<string, number> = {};
    for (const item of moodHistory) {
      for (const rawTag of item.tags) {
        const tag = String(rawTag || '').trim();
        if (!tag) continue;
        frequency[tag] = (frequency[tag] || 0) + 1;
        moodTotals[tag] = (moodTotals[tag] || 0) + item.mood;
      }
    }
    const maxFrequency = Math.max(1, ...Object.values(frequency));
    return Object.entries(frequency)
      .map(([context, count]) => {
        const averageMood = moodTotals[context] / count;
        const impact = averageMood < 3 ? 'Negative' : averageMood < 3.7 ? 'Mixed' : 'Positive';
        return { context, count, impact, bar: Math.round((count / maxFrequency) * 100) };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [moodHistory]);

  const wellnessTrend = useMemo(() => {
    const rows = moodHistory
      .map((item) => {
        const moodScore = Math.round((Math.max(1, Math.min(5, item.mood)) / 5) * 40);
        const total = Math.max(
          0,
          Math.min(100, moodScore + energyToScore(item.energy) + sleepToScore(item.sleepHours ?? null) + stressToScore(item.stressLevel)),
        );
        return { ...item, score: total };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const today = rows.length ? rows[rows.length - 1].score : 0;

    const byWeek: Record<string, { start: Date; total: number; count: number }> = {};
    for (const row of rows) {
      const key = weekKey(row.date);
      if (!byWeek[key]) byWeek[key] = { start: startOfWeek(row.date), total: 0, count: 0 };
      byWeek[key].total += row.score;
      byWeek[key].count += 1;
    }
    const weeklyAverages = Object.values(byWeek)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(-3)
      .map((entry, index, all) => ({
        label: `Week ${index + 1}`,
        value: Math.round(entry.total / entry.count),
        isCurrent: index === all.length - 1,
      }));

    return { today, band: wellnessBand(today), weeklyAverages };
  }, [moodHistory]);

  const therapistAlert = useMemo(() => {
    const sorted = moodHistory.slice().sort((a, b) => b.date.getTime() - a.date.getTime());
    if (!sorted.length) return { needsAttention: false, message: 'No alerts. Keep daily check-ins active.' };

    const moodByDay: Record<string, { total: number; count: number }> = {};
    for (const row of sorted) {
      const key = row.date.toISOString().slice(0, 10);
      if (!moodByDay[key]) moodByDay[key] = { total: 0, count: 0 };
      moodByDay[key].total += row.mood;
      moodByDay[key].count += 1;
    }
    const recentDays = Object.entries(moodByDay)
      .map(([day, info]) => ({ day, avgMood: info.total / info.count }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));

    let lowMoodStreak = 0;
    for (const day of recentDays) {
      if (day.avgMood < 3) lowMoodStreak += 1;
      else break;
    }
    const stressSpikes = sorted.filter((row) => Number(row.stressLevel) >= 8).slice(0, 7).length;
    const lowSleepCount = sorted.filter((row) => Number(row.sleepHours) > 0 && Number(row.sleepHours) < 4).slice(0, 10).length;

    if (lowMoodStreak >= 3) return { needsAttention: true, message: `Mood decline detected for ${lowMoodStreak} consecutive days. Consider reaching out to your therapist.` };
    if (stressSpikes >= 3) return { needsAttention: true, message: 'High stress pattern detected in recent check-ins. Consider support outreach.' };
    if (lowSleepCount >= 3) return { needsAttention: true, message: 'Repeated low-sleep pattern detected. Sleep recovery coaching recommended.' };
    return { needsAttention: false, message: 'No high-risk trend detected this week. Great job staying consistent.' };
  }, [moodHistory]);

  // ── Clinical derived data ───────────────────────────────────
  const clinicalRows = useMemo(() => {
    type ClinicalRow = {
      attemptId?: string;
      date: Date;
      dateLabel: string;
      type: string;
      score: number;
      severity: string;
      interpretation: string;
    };

    const structured = Array.isArray(clinicalQuery.data?.structured) ? clinicalQuery.data?.structured : [];
    const insightsTrend = Array.isArray(clinicalQuery.data?.insights?.assessmentTrend) ? clinicalQuery.data?.insights?.assessmentTrend : [];
    const progressTrend = Array.isArray(clinicalQuery.data?.progress?.assessmentTrend) ? clinicalQuery.data?.progress?.assessmentTrend : [];
    const mergedTrend = [...insightsTrend, ...progressTrend];

    const structuredRows = structured.map((item: any) => {
      const type = item?.type || inferClinicalAssessmentType(String(item?.templateKey || item?.template?.key || item?.templateTitle || 'PHQ-9'));
      const date = parseDate(item?.submittedAt || item?.createdAt);
      if (!date) return null;
      return {
        attemptId: item?.attemptId,
        date,
        dateLabel: formatDay(item?.submittedAt || item?.createdAt),
        type,
        score: Number(item?.totalScore || 0),
        severity: String(item?.severityLevel || 'Unknown'),
        interpretation: String(item?.interpretation || ''),
      };
    });

    const trendRows = mergedTrend.flatMap((item: any) => {
      const date = parseDate(item?.date || item?.createdAt);
      if (!date) return [] as ClinicalRow[];
      const phq = Number(item?.phq9Score || 0);
      const gad = Number(item?.gad7Score || 0);
      if (!phq && !gad) return [] as ClinicalRow[];
      const rows: ClinicalRow[] = [];
      if (phq) rows.push({ attemptId: undefined, date, dateLabel: formatDay(date), type: 'PHQ-9', score: phq, severity: 'Recorded', interpretation: '' });
      if (gad) rows.push({ attemptId: undefined, date, dateLabel: formatDay(date), type: 'GAD-7', score: gad, severity: 'Recorded', interpretation: '' });
      return rows;
    });

    const combinedRows = [...structuredRows, ...trendRows].filter(Boolean) as ClinicalRow[];
    const dedupedRows: ClinicalRow[] = [];
    const seenRows = new Set<string>();

    for (const row of combinedRows) {
      const rowKey = `${row.type}|${row.date.toISOString()}|${row.score}|${row.severity}`;
      if (seenRows.has(rowKey)) continue;
      seenRows.add(rowKey);
      dedupedRows.push(row);
    }
    return dedupedRows;
  }, [clinicalQuery.data]);

  const filteredClinicalRows = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '1m') cutoff.setMonth(now.getMonth() - 1);
    if (timeRange === '3m') cutoff.setMonth(now.getMonth() - 3);
    if (timeRange === '6m') cutoff.setMonth(now.getMonth() - 6);
    if (timeRange === '1y') cutoff.setFullYear(now.getFullYear() - 1);

    return clinicalRows
      .filter((row) => row.date >= cutoff)
      .filter((row) => {
        if (clinicalFilter === 'all') return true;
        if (clinicalFilter === 'phq') return row.type === 'PHQ-9';
        if (clinicalFilter === 'gad') return row.type === 'GAD-7';
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [clinicalRows, clinicalFilter, timeRange]);

  const clinicalSummary = useMemo(() => {
    return getClinicalAssessmentSummary(
      clinicalRows.map((item: any) => ({
        type: item?.type,
        score: Number(item?.score || item?.totalScore || 0),
        level: String(item?.severity || item?.severityLevel || item?.level || 'mild'),
        createdAt: item?.date ? item.date.toISOString() : item?.submittedAt || item?.createdAt,
      })),
    );
  }, [clinicalRows]);

  const clinicalChartData = useMemo(() => {
    const byDate: Record<string, { label: string; phq9?: number; gad7?: number }> = {};
    for (const row of filteredClinicalRows) {
      const key = row.date.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { label: row.dateLabel };
      if (row.type === 'PHQ-9') byDate[key].phq9 = row.score;
      if (row.type === 'GAD-7') byDate[key].gad7 = row.score;
    }
    return Object.values(byDate);
  }, [filteredClinicalRows]);

  const recentClinicalRows = useMemo(
    () => filteredClinicalRows.slice().sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8),
    [filteredClinicalRows],
  );

  // ── Habits derived data ─────────────────────────────────────
  const habitsStats = useMemo(() => {
    const sessions = Array.isArray(habitsQuery.data?.sessions) ? habitsQuery.data?.sessions : [];
    const exercises = Array.isArray(habitsQuery.data?.exercises) ? habitsQuery.data?.exercises : [];
    const exercisesCompleted = exercises.filter((item: any) => String(item?.status || '').toLowerCase() === 'completed').length;
    const audioMinutesListened = exercises
      .filter((item: any) => String(item?.assignedBy || '').startsWith('WELLNESS_LIBRARY:AUDIO'))
      .reduce((sum: number, item: any) => sum + Number(item?.duration || 0), 0);
    const sessionsAttended = sessions.filter((item: any) => String(item?.status || '').toLowerCase() === 'completed').length;
    return { exercisesCompleted, audioMinutesListened, sessionsAttended, totalExercises: exercises.length, totalSessions: sessions.length };
  }, [habitsQuery.data]);

  const correlationData = useMemo(() => {
    const exercises = Array.isArray(habitsQuery.data?.exercises) ? habitsQuery.data?.exercises : [];
    const moodRows = Array.isArray(habitsQuery.data?.moodHistory) ? habitsQuery.data?.moodHistory : [];

    const weeklyExerciseCount: Record<string, number> = {};
    for (const row of exercises) {
      if (String(row?.status || '').toLowerCase() !== 'completed') continue;
      const date = parseDate(row?.createdAt);
      if (!date) continue;
      weeklyExerciseCount[weekKey(date)] = (weeklyExerciseCount[weekKey(date)] || 0) + 1;
    }
    const weeklyMood: Record<string, { total: number; count: number }> = {};
    for (const row of moodRows) {
      const mood = Number(row?.mood || 0);
      if (!mood) continue;
      const date = parseDate(row?.createdAt || row?.created_at || row?.date);
      if (!date) continue;
      const key = weekKey(date);
      if (!weeklyMood[key]) weeklyMood[key] = { total: 0, count: 0 };
      weeklyMood[key].total += mood;
      weeklyMood[key].count += 1;
    }

    const allKeys = Array.from(new Set([...Object.keys(weeklyExerciseCount), ...Object.keys(weeklyMood)]));
    let highMoodTotal = 0, highMoodCount = 0, lowMoodTotal = 0, lowMoodCount = 0;
    for (const key of allKeys) {
      const exerciseCount = weeklyExerciseCount[key] || 0;
      const mood = weeklyMood[key];
      if (!mood?.count) continue;
      const avgMood = mood.total / mood.count;
      if (exerciseCount >= 2) { highMoodTotal += avgMood; highMoodCount += 1; }
      else { lowMoodTotal += avgMood; lowMoodCount += 1; }
    }
    return [
      { name: 'Active Weeks (2+ exercises)', mood: highMoodCount ? Number((highMoodTotal / highMoodCount).toFixed(2)) : 0 },
      { name: 'Low Activity Weeks', mood: lowMoodCount ? Number((lowMoodTotal / lowMoodCount).toFixed(2)) : 0 },
    ];
  }, [habitsQuery.data]);

  // ── URL helpers ──────────────────────────────────────────────
  const setTab = (tab: ProgressTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };
  const setClinicalFilter = (type: ClinicalFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('clinicalType', type);
    setSearchParams(next, { replace: true });
  };
  const setTimeRange = (range: TimeRangeFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('timeRange', range);
    setSearchParams(next, { replace: true });
  };

  const currentStreak = moodQuery.data?.stats?.currentStreak ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-20 lg:pb-8">
      {/* ── PAGE HEADER ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white/95 p-6 shadow-soft-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(133,167,154,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-charcoal md:text-4xl">My Progress</h1>
              <p className="mt-1.5 text-sm text-charcoal/60">
                Track your emotional wellbeing,{' '}
                <span className="font-medium text-calm-sage">clinical growth</span>, and{' '}
                <span className="font-medium text-warm-terracotta">daily habits</span>.
              </p>
            </div>
            <Link
              to="/patient/check-in"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-calm-sage px-5 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition hover:bg-calm-sage/90 hover:-translate-y-0.5"
            >
              <Sun className="h-4 w-4" /> Daily Check-in
            </Link>
          </div>

          <div className="mt-5 flex gap-1 overflow-x-auto border-b border-ink-100 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={`relative shrink-0 flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 ${activeTab === tab.key
                  ? 'text-calm-sage'
                  : 'text-charcoal/55 hover:text-charcoal'
                  }`}
              >
                <span className={activeTab === tab.key ? 'text-calm-sage' : 'text-charcoal/40'}>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-calm-sage" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MOOD & WELLNESS TAB
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'mood' && (
        <div className={`space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {moodQuery.isLoading && <MoodTabSkeleton />}
          {!!moodQuery.error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
              <div>
                <p className="font-semibold text-rose-700">Unable to load mood data</p>
                <p className="text-sm text-rose-600">Check your connection and try again.</p>
              </div>
              <button
                type="button"
                onClick={() => moodQuery.refetch()}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {!moodQuery.isLoading && !moodQuery.error && (
            <>
              {/* Metric cards */}
              <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard
                  label="Avg Mood This Week"
                  value={weeklyAverageMood != null ? `${weeklyAverageMood} / 5` : '—'}
                  helper="Daily Check-in average"
                  icon={<Heart className="h-4 w-4" />}
                  highlight={weeklyAverageMood != null && weeklyAverageMood >= 4}
                  trend={weeklyAverageMood != null ? (weeklyAverageMood >= 3.5 ? 'up' : 'down') : undefined}
                />
                <MetricCard
                  label="Current Streak"
                  value={currentStreak > 0 ? `${currentStreak} 🔥` : '0'}
                  helper="Consecutive check-in days"
                  icon={<Flame className="h-4 w-4" />}
                  highlight={currentStreak >= 7}
                />
                <MetricCard
                  label="Top Emotion"
                  value={topEmotion ?? '—'}
                  helper="Most frequent mood label"
                  icon={<Zap className="h-4 w-4" />}
                />
                <MetricCard
                  label="Top Trigger"
                  value={topTrigger ?? '—'}
                  helper="Most tagged context"
                  icon={<Wind className="h-4 w-4" />}
                />
              </section>

              {/* Insight + streak cards */}
              {moodHistory.length === 0 ? (
                <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                  <EmptyState
                    icon={<Heart className="h-7 w-7" />}
                    title="No mood data yet"
                    body="Start your daily check-in to track your emotional wellbeing. Insights unlock after 3 days of data."
                    action={{ label: 'Start Daily Check-in', to: '/patient/check-in' }}
                  />
                </section>
              ) : (
                <>
                  <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <article className="rounded-2xl border border-calm-sage/25 bg-gradient-to-br from-[#edf4f1] to-[#f2f9f5] p-5 shadow-soft-sm lg:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-calm-sage/20">
                          <TrendingUp className="h-4 w-4 text-calm-sage" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-calm-sage">{moodPatternInsight.title}</p>
                      </div>
                      <p className="text-sm leading-6 text-charcoal/82">{moodPatternInsight.body}</p>
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/60 p-3">
                        <Star className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                        <p className="text-sm font-medium text-charcoal/85">{moodPatternInsight.recommendation}</p>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/40">Check-in Streak</p>
                      <p className="mt-2 text-4xl font-bold text-charcoal">🔥 {currentStreak}</p>
                      <p className="mt-1 text-sm text-charcoal/55">
                        {currentStreak === 0
                          ? 'Start your streak today!'
                          : currentStreak >= 30
                            ? '🏆 Resilience badge unlocked!'
                            : currentStreak >= 7
                              ? '⭐ Consistency badge earned! Keep it up.'
                              : `${7 - currentStreak} more days to your 7-day badge.`}
                      </p>
                      <div className="mt-4 h-2 rounded-full bg-[#edf2ef] overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-calm-sage to-emerald-400 transition-all duration-700"
                          style={{ width: `${Math.min(100, (currentStreak / 30) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-charcoal/45">Progress toward 30-day milestone</p>
                    </article>
                  </section>

                  {/* Mood trend chart */}
                  <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-semibold text-charcoal">Mood Trend</h2>
                      <span className="text-xs text-charcoal/45">Last {Math.min(14, moodChartData.length)} check-ins</span>
                    </div>
                    <p className="text-sm text-charcoal/60">Daily Check-in scores with emotional context.</p>
                    <div className="mt-5 h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={moodChartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7ea695" stopOpacity={0.45} />
                              <stop offset="95%" stopColor="#7ea695" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(38,51,51,0.06)" vertical={false} />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#5f6b6b' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#7c8686' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<MoodTooltip />} />
                          <Area type="monotone" dataKey="mood" stroke="#7ea695" strokeWidth={3} fill="url(#moodGrad)" fillOpacity={1} dot={{ r: 4, fill: '#fff', stroke: '#7ea695', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Context heatmap + weekly snapshot */}
                  <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm xl:col-span-2">
                      <h3 className="text-base font-semibold text-charcoal">Mood Context Heatmap</h3>
                      <p className="mt-1 text-sm text-charcoal/60">How each context affects your mood.</p>
                      <div className="mt-4 space-y-3">
                        {moodContextHeatmap.length > 0 ? (
                          moodContextHeatmap.map((item) => (
                            <div key={item.context} className="rounded-xl border border-ink-50 px-4 py-3 transition hover:border-ink-200">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-charcoal">{item.context}</p>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.impact === 'Negative'
                                    ? 'bg-rose-100 text-rose-700'
                                    : item.impact === 'Mixed'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                >
                                  {item.count}× · {item.impact}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-[#edf2ef]">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${item.impact === 'Negative' ? 'bg-rose-400' : item.impact === 'Mixed' ? 'bg-amber-400' : 'bg-calm-sage'
                                    }`}
                                  style={{ width: `${item.bar}%` }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="py-6 text-center text-sm text-charcoal/50">
                            No context tags yet. Add mood context during daily check-ins to see your heatmap.
                          </p>
                        )}
                      </div>
                    </article>

                    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                      <h3 className="text-base font-semibold text-charcoal">This Week Snapshot</h3>
                      <div className="mt-4 grid grid-cols-3 divide-x divide-ink-100 rounded-xl border border-ink-100 overflow-hidden">
                        {[
                          { emoji: '🙂', label: 'Good', count: weeklyMoodSummary.good, color: 'text-emerald-600' },
                          { emoji: '😐', label: 'Neutral', count: weeklyMoodSummary.neutral, color: 'text-amber-600' },
                          { emoji: '🙁', label: 'Hard', count: weeklyMoodSummary.difficult, color: 'text-rose-600' },
                        ].map((s) => (
                          <div key={s.label} className="flex flex-col items-center py-3">
                            <span className="text-2xl">{s.emoji}</span>
                            <span className={`mt-1 text-xl font-bold ${s.color}`}>{s.count}</span>
                            <span className="text-xs text-charcoal/50">{s.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 space-y-2">
                        {weeklyMoodSummary.graph.length > 0 ? (
                          weeklyMoodSummary.graph.map((point, index) => (
                            <div key={`${point.day}-${index}`} className="flex items-center justify-between rounded-xl bg-[#f6f9f7] px-3 py-2">
                              <span className="text-xs font-medium text-charcoal/65">{point.day}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-[#dde9e5] overflow-hidden">
                                  <div className="h-1.5 rounded-full bg-calm-sage" style={{ width: `${(point.mood / 5) * 100}%` }} />
                                </div>
                                <span className="text-xs font-bold text-charcoal">{point.mood}/5</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="py-4 text-center text-xs text-charcoal/45">No data this week yet</p>
                        )}
                      </div>
                    </article>
                  </section>

                  {/* Wellness trend + score */}
                  <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <article
                      className={`rounded-2xl border p-5 shadow-soft-sm ${wellnessTrend.band.bg} border-opacity-50`}
                      style={{ borderColor: wellnessTrend.band.color + '40' }}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/45">Today's Wellness Score</p>
                      <p className="mt-2 text-5xl font-bold" style={{ color: wellnessTrend.band.color }}>
                        {wellnessTrend.today}
                      </p>
                      <p className="text-sm font-medium text-charcoal/60">out of 100</p>
                      <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${wellnessTrend.band.text} bg-white/70`}>
                        {wellnessTrend.band.label}
                      </span>
                    </article>

                    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm lg:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/45">Weekly Wellness Trend</p>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {wellnessTrend.weeklyAverages.length > 0 ? (
                          wellnessTrend.weeklyAverages.map((row) => (
                            <div
                              key={row.label}
                              className={`rounded-2xl px-4 py-4 text-center transition-all ${row.isCurrent
                                ? 'bg-gradient-to-b from-[#edf4f1] to-[#f2f9f5] ring-1 ring-calm-sage/30'
                                : 'bg-[#f7f9f8]'
                                }`}
                            >
                              <p className="text-xs text-charcoal/50">{row.label}</p>
                              <p className="mt-1 text-2xl font-bold text-charcoal">{row.value}</p>
                              {row.isCurrent && <p className="text-xs font-medium text-calm-sage mt-0.5">Current</p>}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 py-6 text-center text-sm text-charcoal/45">Not enough data yet. Keep checking in.</div>
                        )}
                      </div>
                    </article>
                  </section>

                  {/* Smart therapist alert */}
                  <section
                    className={`rounded-2xl border p-5 shadow-soft-sm flex items-start gap-4 ${therapistAlert.needsAttention
                      ? 'border-rose-300 bg-gradient-to-r from-rose-50 to-red-50'
                      : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-[#f2fbf6]'
                      }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${therapistAlert.needsAttention ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      {therapistAlert.needsAttention ? (
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-bold uppercase tracking-[0.14em] ${therapistAlert.needsAttention ? 'text-rose-600' : 'text-emerald-700'}`}>
                        Smart Wellness Alert
                      </p>
                      <p className={`mt-1 text-sm ${therapistAlert.needsAttention ? 'text-rose-700' : 'text-emerald-800'}`}>{therapistAlert.message}</p>
                    </div>
                    {therapistAlert.needsAttention && (
                      <Link
                        to="/patient/sessions"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        Get Support <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </section>

                  {/* AI insight */}
                  <section className="rounded-2xl border border-calm-sage/25 bg-gradient-to-r from-[#edf4f1] to-[#f8f5ee] p-5 shadow-soft-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-calm-sage/20">
                        <Activity className="h-4 w-4 text-calm-sage" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-calm-sage">Anytime Buddy Insight</p>
                    </div>
                    <p className="text-sm leading-6 text-charcoal/78">{aiMoodInsight}</p>
                    <Link
                      to="/patient/messages"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-calm-sage hover:text-calm-sage/80 transition"
                    >
                      Chat with Anytime Buddy <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CLINICAL SCORES TAB
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'clinical' && (
        <div className={`space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {clinicalQuery.isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Shimmer key={i} className="h-28 rounded-2xl" />)}
              </div>
              <Shimmer className="h-64 rounded-2xl" />
              <Shimmer className="h-80 rounded-2xl" />
            </div>
          )}
          {!!clinicalQuery.error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <p className="text-sm text-rose-700">Unable to load clinical analytics. Please try again.</p>
              <button
                type="button"
                onClick={() => clinicalQuery.refetch()}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {!clinicalQuery.isLoading && !clinicalQuery.error && (
            <>
              {/* Status banner */}
              <section className={`rounded-2xl border p-5 shadow-soft-sm ${clinicalSummary.isComplete ? 'border-calm-sage/30 bg-gradient-to-r from-[#edf4f1] to-[#f2f9f5]' : 'border-amber-200 bg-amber-50/60'}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${clinicalSummary.isComplete ? 'bg-calm-sage/20' : 'bg-amber-100'}`}>
                    {clinicalSummary.isComplete ? (
                      <CheckCircle2 className="h-6 w-6 text-calm-sage" />
                    ) : (
                      <Brain className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold uppercase tracking-[0.16em] ${clinicalSummary.isComplete ? 'text-calm-sage' : 'text-amber-700'}`}>
                      Clinical Report
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-charcoal">
                      {clinicalSummary.isComplete
                        ? 'Your PHQ-9 and GAD-7 report is ready.'
                        : `Complete ${clinicalSummary.missingTypes.join(' and ')} to generate your report.`}
                    </h2>
                    <p className="mt-1 text-sm text-charcoal/65">
                      {clinicalSummary.isComplete
                        ? 'All assessments submitted. Score history and provider-ready report are below.'
                        : 'Once both assessments are submitted, your report and progress chart will appear here.'}
                    </p>
                  </div>
                  {!clinicalSummary.isComplete && (
                    <Link
                      to="/patient/sessions?tab=assessment"
                      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm transition hover:bg-amber-600"
                    >
                      Take Assessment <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </section>

              {/* Status cards */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                  label="PHQ-9 Status"
                  value={clinicalSummary.hasPhq9 ? '✓ Completed' : 'Pending'}
                  helper={clinicalSummary.hasPhq9 ? 'Latest PHQ-9 saved' : 'Required before provider connection'}
                  icon={<Brain className="h-4 w-4" />}
                  highlight={clinicalSummary.hasPhq9}
                />
                <MetricCard
                  label="GAD-7 Status"
                  value={clinicalSummary.hasGad7 ? '✓ Completed' : 'Pending'}
                  helper={clinicalSummary.hasGad7 ? 'Latest GAD-7 saved' : 'Required before provider connection'}
                  icon={<Activity className="h-4 w-4" />}
                  highlight={clinicalSummary.hasGad7}
                />
                <MetricCard
                  label="Provider Unlock"
                  value={clinicalSummary.isComplete ? '🔓 Unlocked' : '🔒 Locked'}
                  helper={clinicalSummary.isComplete ? 'Clinical report ready for provider review' : 'Finish both assessments first'}
                  highlight={clinicalSummary.isComplete}
                />
              </section>

              {/* Filters */}
              <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm font-semibold text-charcoal mb-2">Assessment Type</p>
                    <div className="flex flex-wrap gap-2">
                      {[{ value: 'all', label: 'All Types' }, { value: 'phq', label: 'PHQ-9' }, { value: 'gad', label: 'GAD-7' }].map((pill) => (
                        <button
                          key={pill.value}
                          type="button"
                          onClick={() => setClinicalFilter(pill.value as ClinicalFilter)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${clinicalFilter === pill.value ? 'bg-calm-sage text-white shadow-soft-sm' : 'bg-[#f2f6f4] text-charcoal/70 hover:bg-[#e7efe9]'}`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal mb-2">Time Range</p>
                    <div className="flex flex-wrap gap-2">
                      {[{ value: '1m', label: '1 Month' }, { value: '3m', label: '3 Months' }, { value: '6m', label: '6 Months' }, { value: '1y', label: '1 Year' }].map((pill) => (
                        <button
                          key={pill.value}
                          type="button"
                          onClick={() => setTimeRange(pill.value as TimeRangeFilter)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${timeRange === pill.value ? 'bg-charcoal text-white shadow-soft-sm' : 'bg-[#f2f6f4] text-charcoal/70 hover:bg-[#e7efe9]'}`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Chart */}
              {clinicalChartData.length > 0 ? (
                <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                  <h2 className="text-lg font-semibold text-charcoal">PHQ-9 & GAD-7 Score Timeline</h2>
                  <p className="mt-1 text-sm text-charcoal/60">Severity zones shaded — lower is better.</p>
                  <div className="mt-5 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={clinicalChartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(38,51,51,0.06)" vertical={false} />
                        <ReferenceArea y1={0} y2={4} fill="#2f9e4418" ifOverflow="extendDomain" label={{ value: 'Minimal', position: 'insideTopRight', fontSize: 10, fill: '#22c55e' }} />
                        <ReferenceArea y1={5} y2={9} fill="#f0b42916" ifOverflow="extendDomain" label={{ value: 'Mild', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }} />
                        <ReferenceArea y1={10} y2={14} fill="#f08f2414" ifOverflow="extendDomain" label={{ value: 'Moderate', position: 'insideTopRight', fontSize: 10, fill: '#f97316' }} />
                        <ReferenceArea y1={15} y2={27} fill="#df475914" ifOverflow="extendDomain" label={{ value: 'Severe', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5f6b6b' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: '#7c8686' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ClinicalTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="phq9" name="PHQ-9" stroke="#d97706" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#d97706', strokeWidth: 2 }} connectNulls />
                        <Line type="monotone" dataKey="gad7" name="GAD-7" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#dc2626', strokeWidth: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                  <EmptyState
                    icon={<BarChart2 className="h-7 w-7" />}
                    title="No clinical scores yet"
                    body="Complete your PHQ-9 and GAD-7 assessments to see your score timeline and progress over time."
                    action={{ label: 'Take Assessment', to: '/patient/sessions?tab=assessment' }}
                  />
                </section>
              )}

              {/* Recent scores table */}
              {recentClinicalRows.length > 0 && (
                <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                  <h3 className="text-base font-semibold text-charcoal">Recent Clinical Scores</h3>
                  <div className="mt-4 space-y-3">
                    {recentClinicalRows.map((row, index) => (
                      <div
                        key={`${row.attemptId || row.date.getTime()}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3 transition hover:border-ink-200 hover:bg-[#f9fbfa]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${row.type === 'PHQ-9' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {row.type === 'PHQ-9' ? 'PHQ' : 'GAD'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-charcoal">
                              {row.type} · Score: <span className="text-charcoal/80">{row.score}</span>
                            </p>
                            <p className="text-xs text-charcoal/50">{row.dateLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <SeverityBadge severity={row.severity} />
                          <Link
                            to="/patient/care-team"
                            className="inline-flex items-center gap-1 rounded-full border border-calm-sage/30 px-3 py-1.5 text-xs font-semibold text-calm-sage hover:bg-calm-sage/8 transition"
                          >
                            View Breakdown <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          HABITS & EFFORT TAB
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'habits' && (
        <div className={`space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {habitsQuery.isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Shimmer key={i} className="h-28 rounded-2xl" />)}
              </div>
              <Shimmer className="h-72 rounded-2xl" />
            </div>
          )}
          {!!habitsQuery.error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <p className="text-sm text-rose-700">Unable to load habits analytics right now.</p>
              <button
                type="button"
                onClick={() => habitsQuery.refetch()}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {!habitsQuery.isLoading && !habitsQuery.error && (
            <>
              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                  label="Exercises Completed"
                  value={habitsStats.exercisesCompleted}
                  helper={`of ${habitsStats.totalExercises} total exercises`}
                  icon={<Target className="h-4 w-4" />}
                  highlight={habitsStats.exercisesCompleted > 0}
                  trend={habitsStats.exercisesCompleted > 0 ? 'up' : undefined}
                />
                <MetricCard
                  label="Audio Minutes"
                  value={habitsStats.audioMinutesListened > 0 ? `${habitsStats.audioMinutesListened} min` : '0 min'}
                  helper="From Premium Library sessions"
                  icon={<Moon className="h-4 w-4" />}
                />
                <MetricCard
                  label="Sessions Attended"
                  value={habitsStats.sessionsAttended}
                  helper={`of ${habitsStats.totalSessions} total sessions`}
                  icon={<Calendar className="h-4 w-4" />}
                  highlight={habitsStats.sessionsAttended > 0}
                />
              </section>

              {/* Exercise completion ring visual */}
              {habitsStats.totalExercises > 0 && (
                <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                  <h2 className="text-base font-semibold text-charcoal">Exercise Adherence</h2>
                  <p className="mt-1 text-sm text-charcoal/60">Completion rate across all assigned exercises.</p>
                  <div className="mt-4 flex items-center gap-6">
                    <div className="relative h-24 w-24 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#edf2ef" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none" stroke="#7ea695" strokeWidth="3"
                          strokeDasharray={`${Math.round((habitsStats.exercisesCompleted / habitsStats.totalExercises) * 100)} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-charcoal">
                          {Math.round((habitsStats.exercisesCompleted / habitsStats.totalExercises) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-calm-sage" />
                        <span className="text-charcoal/75">{habitsStats.exercisesCompleted} completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-charcoal/30" />
                        <span className="text-charcoal/55">{habitsStats.totalExercises - habitsStats.exercisesCompleted} remaining</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Correlation chart */}
              <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm">
                <h2 className="text-lg font-semibold text-charcoal">Exercise Completion vs Average Mood</h2>
                <p className="mt-1 text-sm text-charcoal/60">
                  Compare mood between weeks with higher activity vs lower activity.
                </p>
                {correlationData.some((d) => d.mood > 0) ? (
                  <div className="mt-5 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={correlationData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(38,51,51,0.06)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5f6b6b' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#7c8686' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value: any) => [`${value}/5`, 'Avg Mood']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="mood" fill="#7ea695" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      icon={<BarChart2 className="h-7 w-7" />}
                      title="No correlation data yet"
                      body="Complete exercises and daily check-ins to see how activity affects your mood each week."
                      action={{ label: 'View Exercises', to: '/patient/library' }}
                    />
                  </div>
                )}
              </section>

              {/* Quick actions */}
              {/* <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  to="/patient/library"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm transition hover:border-calm-sage/40 hover:-translate-y-0.5 hover:shadow-soft-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-calm-sage/10 transition group-hover:bg-calm-sage/20">
                    <Moon className="h-6 w-6 text-calm-sage" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal">Premium Library</p>
                    <p className="text-sm text-charcoal/55">Access audio & interactive exercises</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-charcoal/30 transition group-hover:text-charcoal/60" />
                </Link>
                <Link
                  to="/patient/sessions"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm transition hover:border-calm-sage/40 hover:-translate-y-0.5 hover:shadow-soft-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-terracotta/10 transition group-hover:bg-warm-terracotta/20">
                    <Calendar className="h-6 w-6 text-warm-terracotta" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal">Book a Session</p>
                    <p className="text-sm text-charcoal/55">Connect with your therapist</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-charcoal/30 transition group-hover:text-charcoal/60" />
                </Link>
              </section> */}

              <section className="rounded-2xl border border-calm-sage/25 bg-gradient-to-r from-[#edf4f1] to-[#f8f5ee] p-5 shadow-soft-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-calm-sage" />
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-calm-sage">Habit Coach Note</p>
                </div>
                <p className="text-sm text-charcoal/80">
                  The recovery story is clearest when effort is visible. Keep completing your planned exercises and wellness sessions to reinforce the gains shown in your mood trend.
                </p>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
