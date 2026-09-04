import React from 'react';
import { AIRecommendation, PDXActivity } from '../types';
import { Sparkles, Trophy, ArrowRight, Zap, Users, Compass, CheckCircle2 } from 'lucide-react';

interface AIRecommendationsCardProps {
  recommendations: AIRecommendation[];
  activities: PDXActivity[];
  onSelectActivity: (activity: PDXActivity) => void;
  onClearAI: () => void;
}

export const AIRecommendationsCard: React.FC<AIRecommendationsCardProps> = ({
  recommendations,
  activities,
  onSelectActivity,
  onClearAI
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-cyan-950/50 border border-cyan-500/30 rounded-2xl p-4 space-y-3.5 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-cyan-200 font-heading tracking-tight">
              AI Personalized Top Recommendations
            </h3>
            <p className="text-[10px] text-slate-400">Tailored to your current time, mood & Portland profile</p>
          </div>
        </div>

        <button
          onClick={onClearAI}
          className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg transition"
        >
          Dismiss
        </button>
      </div>

      {/* List of 3 Ranked Cards */}
      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, index) => {
          const matchedPOI = activities.find(a => a.id === rec.activityId || a.title.toLowerCase().includes(rec.title.toLowerCase()));
          const rankColors = [
            'from-amber-500 to-yellow-600 text-slate-950',
            'from-cyan-500 to-blue-600 text-slate-950',
            'from-emerald-500 to-teal-600 text-slate-950'
          ];

          return (
            <div
              key={rec.activityId || index}
              onClick={() => matchedPOI && onSelectActivity(matchedPOI)}
              className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 transition shadow-md relative"
            >
              {/* Rank Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r ${rankColors[index]} flex items-center gap-1 shadow-sm`}>
                    <Trophy className="w-3 h-3" />
                    #{index + 1} Recommendation
                  </span>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition font-heading">
                    {rec.title}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                  {rec.fitScore}% Match
                </span>
              </div>

              {/* Reason */}
              <p className="text-xs text-slate-300 leading-snug mt-1">
                {rec.reason}
              </p>

              {/* Action & Vibe Pills */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <div className="text-cyan-300 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="line-clamp-1">{rec.suggestedAction}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-auto">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-purple-200">{rec.crowdVibe}</span>
                  <Compass className="w-3.5 h-3.5 text-cyan-400 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
