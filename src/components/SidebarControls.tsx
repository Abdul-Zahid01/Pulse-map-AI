import React from 'react';
import { UserFilters, CategoryType } from '../types';
import { Clock, Flame, Sparkles, MapPin, DollarSign, Users, Filter, ArrowUpDown, LayoutGrid } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { CATEGORY_LABELS } from './ActivityCardList';

interface SidebarControlsProps {
  filters: UserFilters;
  setFilters: React.Dispatch<React.SetStateAction<UserFilters>>;
  onGetAIRecommendations: () => void;
  isLoadingAI: boolean;
  availableCuisines: string[];
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

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as (CategoryType | 'all')[])
  .filter((key): key is CategoryType => key !== 'all')
  .map(key => ({ value: key, label: CATEGORY_LABELS[key].label, icon: CATEGORY_LABELS[key].icon }));

const BUDGET_OPTIONS = [
  { value: 'all', label: 'Any Budget' },
  { value: 'Free', label: 'Free' },
  { value: '$', label: '$ Budget-Friendly' },
  { value: '$$', label: '$$ Mid-Range' },
  { value: '$$$', label: '$$$ Splurge' }
];

const GROUP_OPTIONS = [
  { value: 'all', label: 'Any Group Size' },
  { value: 'solo', label: 'Solo Friendly' },
  { value: 'group', label: 'Group Friendly' }
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Closest First' },
  { value: 'rating', label: 'Top Rated First' },
  { value: 'popularity', label: 'Most Active First' }
];

// Hourly time-of-day options for the scrollable Time dropdown (e.g. "2:00 AM 🌙")
const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const minutesValue = hour * 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const icon = hour >= 5 && hour < 11 ? '☕' : hour >= 11 && hour < 17 ? '☀️' : hour >= 17 && hour < 22 ? '🌆' : '🌙';
  return { value: String(minutesValue), label: `${displayHour}:00 ${period}`, icon };
});

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  filters,
  setFilters,
  onGetAIRecommendations,
  isLoadingAI,
  availableCuisines
}) => {
  // Format current filter time into 12-hr
  const hours = Math.floor(filters.timeMinutes / 60);
  const mins = filters.timeMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;

  const cuisineOptions = availableCuisines.map(c => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1)
  }));

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

        {/* Scrollable Hourly Time Dropdown */}
        <FilterDropdown
          label="Quick Jump"
          icon={<Clock className="w-3 h-3 text-cyan-400" />}
          options={TIME_OPTIONS}
          selected={[String(Math.floor(filters.timeMinutes / 60) * 60)]}
          onChange={(values) => setFilters(prev => ({ ...prev, timeMinutes: Number(values[0]) }))}
        />
      </div>

      {/* Mood & Category Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-heading">
          <Flame className="w-4 h-4 text-emerald-400" />
          2. Mood & Category
        </label>

        <div className="grid grid-cols-2 gap-2">
          <FilterDropdown
            label="Mood / Vibe"
            icon={<Flame className="w-3 h-3 text-emerald-400" />}
            options={MOOD_BADGES.map(b => ({ value: b.label, label: b.label, icon: b.icon }))}
            multiple
            selected={filters.selectedMoods}
            onChange={(values) => setFilters(prev => ({ ...prev, selectedMoods: values }))}
            placeholder="All vibes"
          />
          <FilterDropdown
            label="Category"
            icon={<LayoutGrid className="w-3 h-3 text-cyan-400" />}
            options={CATEGORY_OPTIONS}
            multiple
            selected={filters.selectedCategories}
            onChange={(values) => setFilters(prev => ({ ...prev, selectedCategories: values as CategoryType[] }))}
            placeholder="All categories"
          />
        </div>

        {cuisineOptions.length > 0 && (
          <FilterDropdown
            label="Cuisine"
            icon={<span className="text-xs">🍽️</span>}
            options={cuisineOptions}
            multiple
            selected={filters.selectedCuisines}
            onChange={(values) => setFilters(prev => ({ ...prev, selectedCuisines: values }))}
            placeholder="All cuisines"
          />
        )}
      </div>

      {/* Priorities & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-heading">
          <Filter className="w-4 h-4 text-cyan-400" />
          3. Priorities & Habits
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Social Preference Dropdown */}
          <FilterDropdown
            label="Group Size"
            icon={<Users className="w-3 h-3 text-emerald-400" />}
            options={GROUP_OPTIONS}
            selected={[filters.socialMode]}
            onChange={(values) => setFilters(prev => ({ ...prev, socialMode: values[0] as UserFilters['socialMode'] }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Budget Dropdown */}
          <FilterDropdown
            label="Budget"
            icon={<DollarSign className="w-3 h-3 text-amber-400" />}
            options={BUDGET_OPTIONS}
            selected={[filters.budgetFilter]}
            onChange={(values) => setFilters(prev => ({ ...prev, budgetFilter: values[0] }))}
          />

          {/* Sort By Dropdown */}
          <FilterDropdown
            label="Sort By"
            icon={<ArrowUpDown className="w-3 h-3 text-cyan-400" />}
            options={SORT_OPTIONS}
            selected={[filters.sortBy]}
            onChange={(values) => setFilters(prev => ({ ...prev, sortBy: values[0] as UserFilters['sortBy'] }))}
          />
        </div>

        {/* Open Now Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer pt-1 border-t border-slate-800/80">
          <input
            type="checkbox"
            checked={filters.onlyOpenNow}
            onChange={(e) => setFilters(prev => ({ ...prev, onlyOpenNow: e.target.checked }))}
            className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
          />
          <span className="text-xs font-semibold text-slate-300">Open Now Only</span>
        </label>
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
