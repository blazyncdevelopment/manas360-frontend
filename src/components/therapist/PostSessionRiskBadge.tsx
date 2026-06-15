import { useEffect, useState } from 'react';
import { therapistApi } from '../../api/therapist.api';

type RiskSignal = 'blue' | 'amber' | 'green';

interface RiskData {
	signal: RiskSignal;
	adjustedEmpathyScore: number | null;
	crisisCount: number;
}

const CONFIG: Record<RiskSignal, { label: string; dot: string; bg: string; text: string; glow: string }> = {
	amber: {
		label: 'High Risk',
		dot: 'bg-amber-400',
		bg: 'bg-amber-50 border-amber-200',
		text: 'text-amber-700',
		glow: 'shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]',
	},
	green: {
		label: 'Moderate',
		dot: 'bg-emerald-400',
		bg: 'bg-emerald-50 border-emerald-200',
		text: 'text-emerald-700',
		glow: 'shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]',
	},
	blue: {
		label: 'Safe',
		dot: 'bg-sky-400',
		bg: 'bg-sky-50 border-sky-200',
		text: 'text-sky-700',
		glow: 'shadow-[0_0_8px_2px_rgba(56,189,248,0.35)]',
	},
};

interface Props {
	sessionId: string;
}

export default function PostSessionRiskBadge({ sessionId }: Props) {
	const [data, setData] = useState<RiskData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		therapistApi
			.getSessionRiskSignal(sessionId)
			.then((res) => {
				if (!cancelled) {
					setData({
						signal: res.signal,
						adjustedEmpathyScore: res.adjustedEmpathyScore,
						crisisCount: res.crisisCount,
					});
				}
			})
			.catch(() => {
				if (!cancelled) setData({ signal: 'blue', adjustedEmpathyScore: null, crisisCount: 0 });
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [sessionId]);

	if (loading) {
		return <span className="inline-block h-4 w-14 animate-pulse rounded-full bg-ink-100" />;
	}

	if (!data) return null;

	const cfg = CONFIG[data.signal];

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.glow}`}
			title={
				data.crisisCount > 0
					? `${data.crisisCount} crisis signal${data.crisisCount > 1 ? 's' : ''} detected`
					: 'No crisis signals detected'
			}
		>
			<span className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
			{cfg.label}
			{data.adjustedEmpathyScore !== null && (
				<span className="ml-0.5 opacity-70">{data.adjustedEmpathyScore}%</span>
			)}
		</span>
	);
}
