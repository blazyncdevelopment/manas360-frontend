import { useState, useMemo, useEffect } from 'react';
import { fetchMatchedProviders } from './api';
import {
  Flame,
  Sun,
  Snowflake,
  MessageSquare,
  Target,
  Award
} from 'lucide-react';

interface TagFilter {
  id: string;
  label: string;
  emoji?: string;
}

interface Provider {
  id: string;
  name: string;
  role: string;
  experience: number;
  rating: number;
  // Dynamic factors or scores
  baseExpertise: number;
  baseComm: number;
  baseQuality: number;
  // Specific settings for matching computation
  specializationMatch: string[];
  languagesSupported: string[];
  timeSlots: string[];
  modes: string[];
  contextSupport: string[];
}

export function OnboardingStatusPage() {
  // Simulator interactive state (matching screenshot defaults)
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(['anxiety', 'depression']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['english', 'hindi', 'kannada']);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['morning', 'evening']);
  const [selectedModes, setSelectedModes] = useState<string[]>(['video']);
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['standard']);

  // Dynamic matched providers state loaded from API
  const [providers, setProviders] = useState<Provider[]>([]);

  // Fetch matched providers dynamically from the API whenever filter tags are clicked
  useEffect(() => {
    let active = true;
    fetchMatchedProviders({
      concerns: selectedConcerns,
      languages: selectedLanguages,
      timeSlots: selectedTimes,
      modes: selectedModes,
      contexts: selectedContexts,
    }).then(data => {
      if (active) {
        setProviders(data);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedConcerns, selectedLanguages, selectedTimes, selectedModes, selectedContexts]);

  // Filters configuration
  const concerns: TagFilter[] = [
    { id: 'anxiety', label: 'Anxiety', emoji: '😰' },
    { id: 'depression', label: 'Depression', emoji: '😞' },
    { id: 'trauma', label: 'Trauma', emoji: '💔' },
    { id: 'sleep', label: 'Sleep', emoji: '😴' },
  ];

  const languages: TagFilter[] = [
    { id: 'english', label: 'GB English' },
    { id: 'hindi', label: 'IN Hindi' },
    { id: 'kannada', label: 'IN Kannada' },
    { id: 'tamil', label: 'IN Tamil' },
  ];

  const timePreferences: TagFilter[] = [
    { id: 'morning', label: 'Morning', emoji: '🌅' },
    { id: 'evening', label: 'Evening', emoji: '🌇' },
    { id: 'night', label: 'Night', emoji: '🌙' },
  ];

  const modes: TagFilter[] = [
    { id: 'video', label: 'Video', emoji: '📹' },
    { id: 'phone', label: 'Phone', emoji: '📞' },
    { id: 'chat', label: 'Chat', emoji: '💬' },
  ];

  const contexts: TagFilter[] = [
    { id: 'standard', label: 'Standard' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'night', label: 'Night' },
    { id: 'crisis', label: 'Crisis' },
  ];

  // Compute simulation scores
  const matchedProviders = useMemo(() => {
    return providers.map(p => {
      const matchingConcernsCount = p.specializationMatch.filter(c => selectedConcerns.includes(c)).length;
      let expScore = p.baseExpertise;
      if (selectedConcerns.length > 0) {
        const matchRatio = matchingConcernsCount / selectedConcerns.length;
        expScore = Math.max(10, Math.round(p.baseExpertise * (0.5 + 0.5 * matchRatio)));
      } else {
        expScore = 10;
      }

      const langOverlap = p.languagesSupported.filter(l => selectedLanguages.includes(l)).length;
      const timeOverlap = p.timeSlots.filter(t => selectedTimes.includes(t)).length;
      const modeOverlap = p.modes.filter(m => selectedModes.includes(m)).length;

      const langFactor = selectedLanguages.length > 0 ? (langOverlap / selectedLanguages.length) : 1;
      const timeFactor = selectedTimes.length > 0 ? (timeOverlap / selectedTimes.length) : 1;
      const modeFactor = selectedModes.length > 0 ? (modeOverlap / selectedModes.length) : 1;

      const commMultiplier = (langFactor + timeFactor + modeFactor) / 3;
      const commScore = Math.max(8, Math.round(p.baseComm * (0.4 + 0.6 * commMultiplier)));

      const contextOverlap = p.contextSupport.filter(c => selectedContexts.includes(c)).length;
      const contextFactor = selectedContexts.length > 0 ? (contextOverlap / selectedContexts.length) : 1;
      const qualityScore = Math.max(5, Math.round(p.baseQuality * (0.8 + 0.2 * contextFactor)));

      const totalScore = expScore + commScore + qualityScore;

      let band: 'HOT' | 'WARM' | 'COLD' = 'COLD';
      if (totalScore >= 70) band = 'HOT';
      else if (totalScore >= 50) band = 'WARM';

      return {
        ...p,
        expScore,
        commScore,
        qualityScore,
        totalScore,
        band,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [providers, selectedConcerns, selectedLanguages, selectedTimes, selectedModes, selectedContexts]);

  return (
    <div className="min-h-screen bg-[#0b1222] text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-[1240px] mx-auto">

        {/* Live Matching Engine Simulator */}
        <div className="w-full bg-[#111c34] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#0b1222] px-6 py-4 border-b border-slate-800/80 flex items-center gap-4">
            <div className="flex gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-sm font-semibold tracking-wider text-slate-400 font-mono pl-4">
              Live 3-Parameter Matching Engine
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">

            {/* Left panel: Patient Profile */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-sm font-bold tracking-widest text-[#93c5fd]/90 uppercase mb-4">
                  Patient Profile
                </h2>
              </div>

              {/* Concerns */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-slate-400">Concerns (Expertise)</span>
                <div className="flex flex-wrap gap-2.5">
                  {concerns.map(c => {
                    const active = selectedConcerns.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (selectedConcerns.includes(c.id)) {
                            setSelectedConcerns(selectedConcerns.filter(i => i !== c.id));
                          } else {
                            setSelectedConcerns([...selectedConcerns, c.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${active
                          ? 'border-teal-500/50 text-[#2dd4bf] bg-teal-950/20'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/30'
                          }`}
                      >
                        {c.emoji && <span className="text-sm">{c.emoji}</span>}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-slate-400">Languages (Communication)</span>
                <div className="flex flex-wrap gap-2.5">
                  {languages.map(l => {
                    const active = selectedLanguages.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          if (selectedLanguages.includes(l.id)) {
                            setSelectedLanguages(selectedLanguages.filter(i => i !== l.id));
                          } else {
                            setSelectedLanguages([...selectedLanguages, l.id]);
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${active
                          ? 'border-teal-500/50 text-[#2dd4bf] bg-teal-950/20'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/30'
                          }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Preference */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-slate-400">Time Preference (Communication)</span>
                <div className="flex flex-wrap gap-2.5">
                  {timePreferences.map(t => {
                    const active = selectedTimes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (selectedTimes.includes(t.id)) {
                            setSelectedTimes(selectedTimes.filter(i => i !== t.id));
                          } else {
                            setSelectedTimes([...selectedTimes, t.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${active
                          ? 'border-teal-500/50 text-[#2dd4bf] bg-teal-950/20'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/30'
                          }`}
                      >
                        {t.emoji && <span className="text-sm">{t.emoji}</span>}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-slate-400">Mode (Communication)</span>
                <div className="flex flex-wrap gap-2.5">
                  {modes.map(m => {
                    const active = selectedModes.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          if (selectedModes.includes(m.id)) {
                            setSelectedModes(selectedModes.filter(i => i !== m.id));
                          } else {
                            setSelectedModes([...selectedModes, m.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${active
                          ? 'border-teal-500/50 text-[#2dd4bf] bg-teal-950/20'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/30'
                          }`}
                      >
                        {m.emoji && <span className="text-sm">{m.emoji}</span>}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Context */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-slate-400">Context</span>
                <div className="flex flex-wrap gap-2.5">
                  {contexts.map(c => {
                    const active = selectedContexts.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (selectedContexts.includes(c.id)) {
                            setSelectedContexts(selectedContexts.filter(i => i !== c.id));
                          } else {
                            setSelectedContexts([...selectedContexts, c.id]);
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${active
                          ? 'border-teal-500/50 text-[#2dd4bf] bg-teal-950/20'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/30'
                          }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right panel: Matched Providers */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="text-sm font-bold tracking-widest text-[#93c5fd]/90 uppercase mb-4">
                  Matched Providers (Ranked)
                </h2>
              </div>

              <div className="space-y-4">
                {matchedProviders.map(p => {
                  let scoreColor = 'text-sky-400';
                  let bandTag = (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400 tracking-wider">
                      <Snowflake className="w-3 h-3" /> COLD
                    </span>
                  );

                  if (p.band === 'HOT') {
                    scoreColor = 'text-orange-500';
                    bandTag = (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 tracking-wider">
                        <Flame className="w-3.5 h-3.5 fill-current" /> HOT
                      </span>
                    );
                  } else if (p.band === 'WARM') {
                    scoreColor = 'text-amber-400';
                    bandTag = (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 tracking-wider">
                        <Sun className="w-3.5 h-3.5" /> WARM
                      </span>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      className="bg-[#0e172a]/70 rounded-2xl border border-slate-800/80 p-5 flex items-center justify-between gap-4 hover:border-slate-700/80 transition-all shadow-md"
                    >
                      <div className="space-y-3.5 flex-grow">
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight">{p.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {p.role} · {p.experience}yr · <span className="inline-flex items-center gap-0.5 text-amber-400">★ {p.rating}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-red-950/20 text-[#fca5a5] border border-red-500/10 rounded-md">
                            <Target className="w-3.5 h-3.5" /> Expertise {p.expScore}/40
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-emerald-950/20 text-[#86efac] border border-emerald-500/10 rounded-md">
                            <MessageSquare className="w-3.5 h-3.5" /> Comm {p.commScore}/35
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-amber-950/20 text-[#fde047] border border-amber-500/10 rounded-md">
                            <Award className="w-3.5 h-3.5" /> Quality {p.qualityScore}/25
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-center items-end min-w-[70px]">
                        <span className={`text-4xl font-extrabold tracking-tight ${scoreColor}`}>
                          {p.totalScore}
                        </span>
                        <div className="mt-1">{bandTag}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default OnboardingStatusPage;
