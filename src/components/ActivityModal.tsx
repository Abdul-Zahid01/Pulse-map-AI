import React, { useState } from 'react';
import { PDXActivity } from '../types';
import { X, MapPin, Clock, Users, Star, Send, CheckCircle2, MessageSquare, Compass, Sparkles, Navigation } from 'lucide-react';
import { CATEGORY_LABELS } from './ActivityCardList';

interface ActivityModalProps {
  activity: PDXActivity | null;
  onClose: () => void;
  onCheckIn: (activityId: string) => void;
  hasCheckedIn: boolean;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  activity,
  onClose,
  onCheckIn,
  hasCheckedIn
}) => {
  if (!activity) return null;

  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { name: 'Jake M.', avatar: '🧑‍💻', text: 'Heading over from Central Eastside in 10 mins!', time: '2m ago' },
    { name: 'Sarah K.', avatar: '👩‍🎨', text: 'The atmosphere is amazing tonight, fire pits are lit!', time: '5m ago' },
    { name: 'Devon T.', avatar: '🏀', text: 'Anyone want to team up for pickup games?', time: '12m ago' }
  ]);

  const meta = CATEGORY_LABELS[activity.category];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages(prev => [
      ...prev,
      { name: 'You', avatar: '🦉', text: chatMessage.trim(), time: 'Just now' }
    ]);
    setChatMessage('');
  };

  const handleToggleCheckIn = () => {
    onCheckIn(activity.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header Image / Pattern Banner */}
        <div className="h-32 bg-gradient-to-r from-cyan-900 via-indigo-900 to-slate-900 p-4 relative flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition z-10 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-950/80 text-cyan-300 border border-cyan-800/80 flex items-center gap-1">
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activity.activeUsersCount} Active Right Now
            </span>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white font-heading tracking-tight">
              {activity.title}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activity.neighborhood}</span> • <span>{activity.address}</span>
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Hours</span>
              <p className="text-xs font-bold font-mono text-cyan-300">{activity.openHours.start} - {activity.openHours.end}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Price</span>
              <p className="text-xs font-bold text-amber-300">{activity.priceLevel}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Rating</span>
              <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {activity.rating}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading mb-1">About Spot</h4>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {activity.description}
            </p>
          </div>

          {/* Highlight Note */}
          {activity.featuredHighlight && (
            <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Live Pulse Status</span>
                <p className="text-xs text-cyan-100 font-medium">{activity.featuredHighlight}</p>
              </div>
            </div>
          )}

          {/* Join Group & Check In Action Button */}
          <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-3 rounded-2xl border border-indigo-900/60 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Who is Going / Join Group
              </h4>
              <p className="text-[10px] text-slate-400">Signal that you're heading there to meet up with fellow Portlanders!</p>
            </div>

            <button
              onClick={handleToggleCheckIn}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 shadow-lg ${
                hasCheckedIn
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-emerald-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hasCheckedIn ? 'Checked In!' : 'I am Going!'}</span>
            </button>
          </div>

          {/* Live Group Chat Feed */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Live Social Feed
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">Active Check-ins</span>
            </h4>

            <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs">
              {messages.map((m, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-base">{m.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <strong className="text-slate-200 text-xs">{m.name}</strong>
                      <span className="text-[10px] text-slate-500">{m.time}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Drop a note for people going..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.title + ' ' + activity.address)}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            Open Directions in Google Maps
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
