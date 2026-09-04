import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PDXActivity, CategoryType } from '../types';
import { CATEGORY_LABELS } from './ActivityCardList';

interface MapViewProps {
  activities: PDXActivity[];
  selectedActivity: PDXActivity | null;
  onSelectActivity: (activity: PDXActivity) => void;
  onOpenCheckInModal: (activity: PDXActivity) => void;
  currentTimeMinutes: number;
}

const CATEGORY_COLORS: Record<CategoryType, { bg: string; border: string; glow: string; text: string }> = {
  food: { bg: '#f59e0b', border: '#fbbf24', glow: 'rgba(245, 158, 11, 0.6)', text: '#000' },
  sports: { bg: '#10b981', border: '#34d399', glow: 'rgba(16, 185, 129, 0.6)', text: '#000' },
  tech_events: { bg: '#06b6d4', border: '#22d3ee', glow: 'rgba(6, 182, 212, 0.6)', text: '#000' },
  markets: { bg: '#f43f5e', border: '#fb7185', glow: 'rgba(244, 63, 94, 0.6)', text: '#000' },
  nightlife: { bg: '#a855f7', border: '#c084fc', glow: 'rgba(168, 85, 247, 0.6)', text: '#000' },
  social: { bg: '#3b82f6', border: '#60a5fa', glow: 'rgba(59, 130, 246, 0.6)', text: '#000' }
};

export const MapView: React.FC<MapViewProps> = ({
  activities,
  selectedActivity,
  onSelectActivity,
  onOpenCheckInModal,
  currentTimeMinutes
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const heatCirclesRef = useRef<L.Layer[]>([]);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Downtown Portland
    const map = L.map(mapContainerRef.current, {
      center: [45.518, -122.668],
      zoom: 13,
      zoomControl: false
    });

    // CartoDB Dark Matter tiles for Snapchat Map style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; CARTO & OpenStreetMap'
    }).addTo(map);

    // Zoom controls on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Helper to check open status
  const isPOIOpen = (act: PDXActivity) => {
    const hours = Math.floor(currentTimeMinutes / 60);
    const startHour = parseInt(act.openHours.start.split(':')[0], 10);
    let endHour = parseInt(act.openHours.end.split(':')[0], 10);
    if (endHour < startHour) endHour += 24;

    const currentCheck = (hours < startHour && startHour > 12) ? hours + 24 : hours;
    return currentCheck >= startHour && currentCheck < endHour;
  };

  // Update Markers & Heatmaps whenever activities, selectedActivity or time change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    (Object.values(markersRef.current) as L.Marker[]).forEach(marker => marker.remove());
    markersRef.current = {};

    // Clear existing heat circles
    heatCirclesRef.current.forEach((c: L.Layer) => c.remove());
    heatCirclesRef.current = [];

    // Render Heatmap pulses around active hubs
    activities.forEach(act => {
      if (act.activeUsersCount > 25) {
        const colors = CATEGORY_COLORS[act.category];
        const circle = L.circle([act.lat, act.lng], {
          radius: 350 + act.activeUsersCount * 5,
          color: colors.bg,
          fillColor: colors.bg,
          fillOpacity: 0.12,
          stroke: true,
          weight: 1,
          opacity: 0.4
        }).addTo(map);

        heatCirclesRef.current.push(circle);
      }
    });

    // Create Markers
    activities.forEach(act => {
      const colors = CATEGORY_COLORS[act.category];
      const openNow = isPOIOpen(act);
      const isSelected = selectedActivity?.id === act.id;
      const meta = CATEGORY_LABELS[act.category];

      // Build DivIcon HTML for Snapchat Map Style
      const pulseHtml = (act.activeUsersCount > 15 || openNow)
        ? `<div style="position: absolute; top:-6px; left:-6px; right:-6px; bottom:-6px; border-radius: 9999px; border: 2px solid ${colors.bg}; animation: map-pulse-ring 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;"></div>`
        : '';

      const markerHtml = `
        <div style="position: relative; cursor: pointer; transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'}; transition: transform 0.2s ease;">
          ${pulseHtml}
          <div style="
            width: 36px;
            height: 36px;
            background: #0f172a;
            border: 2px solid ${isSelected ? '#38bdf8' : colors.border};
            box-shadow: 0 0 15px ${colors.glow}, 0 4px 6px rgba(0,0,0,0.6);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            position: relative;
            z-index: 10;
          ">
            ${meta.icon}
          </div>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${isSelected ? '#38bdf8' : colors.border};
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-snap-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 42],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([act.lat, act.lng], { icon: customIcon }).addTo(map);

      // Build Popup Content HTML
      const popupHtml = `
        <div style="padding: 14px; width: 260px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(51, 65, 85, 0.8); color: #cbd5e1; padding: 2px 8px; border-radius: 9999px;">
              ${meta.icon} ${meta.label.split(' ')[0]}
            </span>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; background: ${openNow ? 'rgba(6, 78, 59, 0.9)' : 'rgba(30, 41, 59, 0.9)'}; color: ${openNow ? '#6ee7b7' : '#94a3b8'}; border: 1px solid ${openNow ? '#059669' : '#475569'};">
              ${openNow ? '🟢 OPEN NOW' : '⚪ CLOSED'}
            </span>
          </div>

          <h3 style="font-size: 15px; font-weight: 800; color: #f8fafc; margin: 0 0 4px 0; font-family: 'Outfit', sans-serif;">
            ${act.title}
          </h3>

          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px 0;">
            📍 ${act.neighborhood} • ${act.address.split(',')[0]}
          </p>

          <p style="font-size: 11px; color: #e2e8f0; line-height: 1.4; margin: 0 0 10px 0;">
            ${act.description}
          </p>

          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.8); padding: 8px 10px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 10px;">
            <span style="font-size: 11px; color: #34d399; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ⚡ ${act.activeUsersCount} active right now
            </span>
            <span style="font-size: 10px; color: #fbbf24; font-weight: 700;">
              ⭐ ${act.rating}
            </span>
          </div>

          <button id="btn-join-${act.id}" style="
            width: 100%;
            padding: 8px;
            background: linear-gradient(135deg, #06b6d4, #10b981);
            color: #020617;
            font-size: 11px;
            font-weight: 800;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 4px 10px rgba(6, 182, 212, 0.3);
          ">
            👥 Join Group / Check In
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Event Handlers
      marker.on('click', () => {
        onSelectActivity(act);
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-join-${act.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              onOpenCheckInModal(act);
            };
          }
        }, 50);
      });

      markersRef.current[act.id] = marker;
    });
  }, [activities, selectedActivity, currentTimeMinutes]);

  // Center map on selectedActivity when clicked from list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedActivity) return;

    map.flyTo([selectedActivity.lat, selectedActivity.lng], 14, {
      duration: 1.2
    });

    const marker = markersRef.current[selectedActivity.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedActivity]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Snapchat Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-xl max-w-xs pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 font-heading flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Snapchat Pulse Map Legend
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" /> Food Carts
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" /> Sports & Hoops
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" /> Tech & Coding
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm" /> Nightlife & DJs
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm" /> Night Markets
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm" /> Social Hangouts
          </div>
        </div>
      </div>

      {/* Portland Center Marker Reference */}
      <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 font-mono shadow-lg flex items-center gap-2 pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Portland, OR (45.5152° N, 122.6784° W)</span>
      </div>
    </div>
  );
};
