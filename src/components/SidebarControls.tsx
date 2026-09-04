import React from 'react';
import { UserFilters } from '../types';
import { Clock, Flame, Sparkles, MapPin, DollarSign, Users, Filter, Check } from 'lucide-react';

interface SidebarControlsProps {
  filters: UserFilters;
  setFilters: React.Dispatch<React.SetStateAction<UserFilters>>;
  onGetAIRecommendations: () => void;
  isLoadingAI: boolean;
}

export const MOOD_BADGES = [
  { id: 'late_night', label: 'Late Night Craving 🍕', icon: '🍕' },
  { id: 'sports', label: 'Spontaneous Sport 🏀', icon: '🏀' },
  { id: 'tech', label: 'Tech & Coding 💻', icon: '💻' },
  { id: 'social', label: 'Social / Meet People 🤝', icon: '🤝' },
  { id: 'chill', label: 'Chill Vibe ☕', icon: '☕' },
  { id: 'music', label: 'Live Music & Vibes 🎵', icon: '🎵' },
  { id: 'markets', label: 'Local Market & Crafts 🛍️', icon: '🛍️' }
];

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  filters,
  setFilters,
  onGetAIRecommendations,
  isLoadingAI
}) => {
  // Format current filter time into 12-hr
  const hours = Math.floor(filters.timeMinutes / 60);
  const mins = filters.timeMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;

  const toggleMood = (label: string) => {
    setFilters(prev => {
      const exists = prev.selectedMoods.includes(label);
      if (exists) {
        return { ...prev, selectedMoods: prev.selectedMoods.filter(m => m !== label) };
      } else {
        return { ...prev, selectedMoods: [...prev.selectedMoods, label] };
      }
    });
  };

  const setQuickTime = (minsValue: number) => {
    setFilters(prev => ({ ...prev, timeMinutes: minsValue }));
  };

  return (
    <div className="space-y-4">
      {/* Time Selector Widget */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-heading">
            <Clock className="w-4 h-4 text-cyan-400" />
            1. Time of Day Context
          </label>
          <span className="text-xs font-bold font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800/80">
            {displayHours}:{displayMins} {period}
          </span>
        </div>

        {/* Time Slider */}
        <div>
          <input
            type="range"
            min={0}
            max={1439}
            step={15}
            value={filters.timeMinutes}
            onChange={(e) => setFilters(prev => ({ ...prev, timeMinutes: Number(e.target.value) }))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 font-semibold">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11:45 PM</span>
          </div>
        </div>

        {/* Quick Time Preset Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() => setQuickTime(135)} // 2:15 AM
            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition text-center border ${
              filters.timeMinutes >= 0 && filters.timeMinutes < 300
                ? 'bg-purple-950 text-purple-200 border-purple-700 shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
          >
            🌙 2:15 AM
          </button>
          <button
            onClick={() => setQuickTime(480)} // 8:00 AM
            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition text-center border ${
              filters.timeMinutes >= 300 && filters.timeMinutes < 720
                ? 'bg-amber-950 text-amber-200 border-amber-700 shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
          >
            ☕ 8:00 AM
          </button>
          <button
            onClick={() => setQuickTime(840)} // 2:00 PM
            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition text-center border ${
              filters.timeMinutes >= 720 && filters.timeMinutes < 1020
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700 shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
          >
            ☀️ 2:00 PM
          </button>
          <button
            onClick={() => setQuickTime(1200)} // 8:00 PM
            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition text-center border ${
              filters.timeMinutes >= 1020
                ? 'bg-cyan-950 text-cyan-200 border-cyan-700 shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
          >
            🌆 8:00 PM
          </button>
        </div>
      </div>

      {/* Mood Selector Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-heading">
            <Flame className="w-4 h-4 text-emerald-400" />
            2. Current Mood / Vibe
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {filters.selectedMoods.length === 0 ? 'All vibes' : `${filters.selectedMoods.length} selected`}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MOOD_BADGES.map(badge => {
            const isSelected = filters.selectedMoods.includes(badge.label);
            return (
              <button
                key={badge.id}
                onClick={() => toggleMood(badge.label)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <span>{badge.label}</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priorities & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-heading">
          <Filter className="w-4 h-4 text-cyan-400" />
          3. Priorities & Habits
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Max Distance Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" /> Distance
              </span>
              <span className="font-bold text-cyan-300">{filters.maxDistanceMiles} mi</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              value={filters.maxDistanceMiles}
              onChange={(e) => setFilters(prev => ({ ...prev, maxDistanceMiles: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Social Preference Toggle */}
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" /> Group Size
            </div>
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              {(['all', 'solo', 'group'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilters(prev => ({ ...prev, socialMode: mode }))}
                  className={`flex-1 text-[10px] font-bold py-1 rounded-lg capitalize transition ${
                    filters.socialMode === mode
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Filter & Open Now Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-slate-400">Budget:</span>
            <div className="flex gap-1">
              {['all', '$', '$$', 'Free'].map(b => (
                <button
                  key={b}
                  onClick={() => setFilters(prev => ({ ...prev, budgetFilter: b }))}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition ${
                    filters.budgetFilter === b
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onlyOpenNow}
              onChange={(e) => setFilters(prev => ({ ...prev, onlyOpenNow: e.target.checked }))}
              className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-xs font-semibold text-slate-300">Open Now Only</span>
          </label>
        </div>
      </div>

      {/* AI Recommendation Trigger Button */}
      <button
        onClick={onGetAIRecommendations}
        disabled={isLoadingAI}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-600 hover:from-cyan-400 hover:via-emerald-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        <Sparkles className={`w-5 h-5 text-slate-950 ${isLoadingAI ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
        <span>{isLoadingAI ? 'AI Analyzing PDX Pulses...' : 'AI Recommend What To Do Right Now'}</span>
      </button>
    </div>
  );
};
