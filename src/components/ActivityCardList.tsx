import React from 'react';
import { PDXActivity, CategoryType } from '../types';
import { Search, MapPin, Clock, Users, Star, Flame, Tag, ExternalLink } from 'lucide-react';

interface ActivityCardListProps {
  activities: PDXActivity[];
  selectedActivity: PDXActivity | null;
  onSelectActivity: (activity: PDXActivity) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryType | 'all';
  setSelectedCategory: (cat: CategoryType | 'all') => void;
  currentTimeMinutes: number;
}

export const CATEGORY_LABELS: Record<CategoryType | 'all', { label: string; icon: string; color: string }> = {
  all: { label: 'All Places', icon: '🌐', color: 'bg-slate-800 text-slate-200 border-slate-700' },
  food: { label: 'Food Carts & Eats', icon: '🍕', color: 'bg-amber-950/80 text-amber-300 border-amber-800' },
  sports: { label: 'Sports & Bouldering', icon: '🏀', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' },
  tech_events: { label: 'Tech & Hackathons', icon: '💻', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-800' },
  markets: { label: 'Night Markets & Crafts', icon: '🛍️', color: 'bg-rose-950/80 text-rose-300 border-rose-800' },
  nightlife: { label: 'Nightlife & Music', icon: '🎵', color: 'bg-purple-950/80 text-purple-300 border-purple-800' },
  social: { label: 'Social Hangouts', icon: '🤝', color: 'bg-blue-950/80 text-blue-300 border-blue-800' }
};

export const ActivityCardList: React.FC<ActivityCardListProps> = ({
  activities,
  selectedActivity,
  onSelectActivity,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  currentTimeMinutes
}) => {
  // Utility function to check if POI is open at selected time
  const isPOIOpen = (act: PDXActivity) => {
    const hours = Math.floor(currentTimeMinutes / 60);
    const startHour = parseInt(act.openHours.start.split(':')[0], 10);
    let endHour = parseInt(act.openHours.end.split(':')[0], 10);
    if (endHour < startHour) endHour += 24;

    const currentCheck = (hours < startHour && startHour > 12) ? hours + 24 : hours;
    return currentCheck >= startHour && currentCheck < endHour;
  };

  return (
    <div className="space-y-3">
      {/* Search Bar & Category Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PDX spots, neighborhoods, or vibes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'food', 'sports', 'tech_events', 'markets', 'nightlife', 'social'] as const).map(cat => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORY_LABELS[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition shrink-0 flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
        <span>Showing <strong className="text-slate-200 font-bold">{activities.length}</strong> spots in PDX</span>
        <span className="text-[10px] text-cyan-400 font-mono">Snapchat Pulse View</span>
      </div>

      {/* Scrolling List */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400 font-medium">No activity spots match your current filters.</p>
            <p className="text-[10px] text-slate-500 mt-1">Try relaxing the time, budget, or distance sliders!</p>
          </div>
        ) : (
          activities.map(act => {
            const isSelected = selectedActivity?.id === act.id;
            const openNow = isPOIOpen(act);
            const meta = CATEGORY_LABELS[act.category];

            return (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className={`group cursor-pointer rounded-2xl p-3 border transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Active Pulse Glow Bar on Selected */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-emerald-400" />
                )}

                {/* Top Row: Title & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition font-heading flex items-center gap-1.5">
                      {act.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{act.neighborhood}</span> • <span className="font-mono text-slate-300">{act.address.split(',')[0]}</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        openNow
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {openNow ? 'OPEN NOW' : 'CLOSED'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {act.rating}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>

                {/* Tags & Active User Pulse Footer */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.color}`}>
                      {meta.icon} {meta.label.split(' ')[0]}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                      {act.priceLevel}
                    </span>
                  </div>

                  {/* Social Active Count */}
                  <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <Users className="w-3 h-3" />
                    <span className="font-bold text-[10px] font-mono">{act.activeUsersCount} active</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
