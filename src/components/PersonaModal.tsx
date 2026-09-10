import React, { useState } from 'react';
import { PersonaProfile, CategoryType } from '../types';
import { X, User, Sparkles, Check } from 'lucide-react';
import { PORTLAND_PERSONAS } from '../data/personas';

interface PersonaModalProps {
  currentPersona: PersonaProfile;
  onSavePersona: (updated: PersonaProfile) => void;
  onClose: () => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  currentPersona,
  onSavePersona,
  onClose
}) => {
  const [name, setName] = useState(currentPersona.name);
  const [age, setAge] = useState(currentPersona.age);
  const [tagline, setTagline] = useState(currentPersona.tagline);
  const [bio, setBio] = useState(currentPersona.bio);
  const [nightOwlLevel, setNightOwlLevel] = useState(currentPersona.nightOwlLevel);
  const [avatarEmoji, setAvatarEmoji] = useState(currentPersona.avatarEmoji);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePersona({
      ...currentPersona,
      id: `custom-${Date.now()}`,
      name,
      age: Number(age),
      tagline,
      bio,
      nightOwlLevel
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-y-auto max-h-[90vh] shadow-2xl relative">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-cyan-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-heading">
                Configure Your Portland Persona
              </h3>
              <p className="text-[11px] text-slate-400">Tailor the AI recommendation engine to your lifestyle</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Switcher */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-1">
          <span className="text-xs text-slate-400 font-semibold">Presets:</span>
          <div className="flex gap-1.5">
            {PORTLAND_PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setName(p.name);
                  setAge(p.age);
                  setTagline(p.tagline);
                  setBio(p.bio);
                  setNightOwlLevel(p.nightOwlLevel);
                  setAvatarEmoji(p.avatarEmoji);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <span>{p.avatarEmoji}</span>
                <span>{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Avatar & Name */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Emoji Avatar</label>
              <select
                value={avatarEmoji}
                onChange={(e) => setAvatarEmoji(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-base text-center text-slate-200"
              >
                <option value="🦉">🦉 Owl</option>
                <option value="🌿">🌿 Nature</option>
                <option value="🍻">🍻 Craft Beer</option>
                <option value="☕">☕ Coffee</option>
                <option value="💻">💻 Tech</option>
                <option value="🏀">🏀 Hoops</option>
                <option value="🎵">🎵 Music</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Age & Night Owl Level */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
                min={18}
                max={99}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Schedule Preference</label>
              <select
                value={nightOwlLevel}
                onChange={(e) => setNightOwlLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Early Riser">Early Riser</option>
                <option value="Balanced">Balanced</option>
                <option value="Night Owl">Night Owl</option>
                <option value="24/7 Insomniac">24/7 Insomniac</option>
              </select>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g., 28 y/o Dev & Night Owl"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Daily Habits & Preferences Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Describe what you like doing in Portland..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold flex items-center gap-1 transition shadow-md shadow-cyan-500/20"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Persona
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
