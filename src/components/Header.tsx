import React from 'react';
import { Compass, Clock, Zap, RefreshCw, UserCheck, Sparkles } from 'lucide-react';
import { PersonaProfile } from '../types';

interface HeaderProps {
  timeFormatted: string;
  timeMinutes: number;
  setTimeMinutes: (mins: number) => void;
  activePersona: PersonaProfile;
  onOpenPersonaModal: () => void;
  onResetFilters: () => void;
  totalActiveUsers: number;
  isRealtimeSync: boolean;
  setIsRealtimeSync: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeFormatted,
  timeMinutes,
  setTimeMinutes,
  activePersona,
  onOpenPersonaModal,
  onResetFilters,
  totalActiveUsers,
  isRealtimeSync,
  setIsRealtimeSync
}) => {
  // Format current time into 12-hr display
  const hours = Math.floor(timeMinutes / 60);
  const mins = timeMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;

  // Determine time phase tag
  let phaseTag = 'Night Owl';
  let phaseColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  if (hours >= 5 && hours < 11) {
    phaseTag = 'Morning Coffee';
    phaseColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (hours >= 11 && hours < 17) {
    phaseTag = 'Afternoon Pulse';
    phaseColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (hours >= 17 && hours < 22) {
    phaseTag = 'Evening Social';
    phaseColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  } else {
    phaseTag = 'Late Night 2AM Vibe';
    phaseColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  }

  const handleSyncActualTime = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    setTimeMinutes(currentMins);
    setIsRealtimeSync(true);
  };

  return (
    <header className="min-h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-30 shrink-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3 order-1">
        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
              PULSE MAP <span className="text-cyan-400 font-extrabold">PDX</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded-full hidden sm:inline-block">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 hidden sm:flex">
            <span>Portland Real-Time Heatmap & AI Concierge</span>
          </p>
        </div>
      </div>

      {/* Center Simulated Time Widget */}
      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/90 rounded-xl px-3 py-1.5 shadow-inner order-3 sm:order-2 basis-full sm:basis-auto justify-center">
        <Clock className="w-4 h-4 text-cyan-400" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-slate-100 font-mono tracking-tight">
            {displayHours}:{displayMins} {period}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${phaseColor}`}>
            {phaseTag}
          </span>
        </div>

        <button
          onClick={handleSyncActualTime}
          title="Sync with real clock"
          className={`ml-1 p-1 rounded-lg text-xs font-medium transition ${
            isRealtimeSync ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Controls: Persona & Social Count */}
      <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-3">
        {/* Active Portlanders Pulse Counter */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300 font-medium">
            <strong className="text-emerald-400 font-bold">{totalActiveUsers}</strong> Portlanders active
          </span>
        </div>

        {/* Persona Quick Indicator */}
        <button
          onClick={onOpenPersonaModal}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-xs font-semibold text-cyan-200 transition shadow-sm group"
        >
          <span className="text-base">{activePersona.avatarEmoji}</span>
          <span className="max-w-[110px] truncate hidden sm:inline">{activePersona.name}</span>
          <UserCheck className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        </button>

        {/* Reset Filters */}
        <button
          onClick={onResetFilters}
          title="Reset Filters"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
