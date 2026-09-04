import React from 'react';
import { PersonaProfile } from '../types';
import { User, Sparkles, Check, Settings2, SlidersHorizontal } from 'lucide-react';
import { PORTLAND_PERSONAS } from '../data/personas';

interface PersonaBannerProps {
  activePersona: PersonaProfile;
  setActivePersona: (persona: PersonaProfile) => void;
  isCustomized: boolean;
  onOpenModal: () => void;
}

export const PersonaBanner: React.FC<PersonaBannerProps> = ({
  activePersona,
  setActivePersona,
  isCustomized,
  onOpenModal
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-3.5 shadow-xl relative overflow-hidden">
      {/* Background Subtle Pattern */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            Portlander Daily Habit Profile
          </span>
          {isCustomized && (
            <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
              Customized
            </span>
          )}
        </div>

        <button
          onClick={onOpenModal}
          className="text-xs font-medium text-slate-400 hover:text-cyan-300 flex items-center gap-1 hover:underline transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          Edit Persona
        </button>
      </div>

      {/* Main Persona Details */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
          {activePersona.avatarEmoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <h3 className="font-bold text-slate-100 text-sm truncate font-heading flex items-center gap-1.5">
              {activePersona.name}
              <span className="text-xs font-medium text-slate-400">({activePersona.age}y/o)</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
              {activePersona.nightOwlLevel}
            </span>
          </div>

          <p className="text-xs text-cyan-200/90 font-medium mt-0.5 leading-snug">
            "{activePersona.tagline}"
          </p>

          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
            {activePersona.bio}
          </p>
        </div>
      </div>

      {/* Quick Preset Selector Switcher */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Preset Profiles:
        </span>
        <div className="flex items-center gap-1.5">
          {PORTLAND_PERSONAS.map(p => {
            const isSelected = activePersona.id === p.id && !isCustomized;
            return (
              <button
                key={p.id}
                onClick={() => setActivePersona(p)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-xl transition flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{p.avatarEmoji}</span>
                <span>{p.name.split(' ')[0]}</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
