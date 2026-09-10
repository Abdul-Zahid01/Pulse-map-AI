import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PDXActivity, CategoryType } from '../types';
import { CATEGORY_LABELS } from './ActivityCardList';

type MapTheme = 'day' | 'night';

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

// Free OpenFreeMap vector styles — no API key required, includes buildings for 3D extrusion
const STYLE_URLS: Record<MapTheme, string> = {
  night: 'https://tiles.openfreemap.org/styles/dark',
  day: 'https://tiles.openfreemap.org/styles/positron'
};

// Assigns each building a vivid color from a fixed palette (bucketed by feature id) for a playful,
// cartoon-city look instead of one flat "glass box" tone. Reuses the same hues as the POI category pins.
const NIGHT_BUILDING_PALETTE = ['#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#a855f7', '#3b82f6', '#fb923c', '#34d399'];
const DAY_BUILDING_PALETTE = ['#fbbf24', '#6ee7b7', '#67e8f9', '#fda4af', '#c4b5fd', '#93c5fd', '#fdba74', '#5eead4'];

const buildPalette = (colors: string[]): maplibregl.ExpressionSpecification => [
  'match',
  ['%', ['coalesce', ['id'], 0], colors.length],
  ...colors.flatMap((color, i) => [i, color]),
  colors[0]
];

const BUILDING_COLOR: Record<MapTheme, maplibregl.ExpressionSpecification> = {
  night: buildPalette(NIGHT_BUILDING_PALETTE),
  day: buildPalette(DAY_BUILDING_PALETTE)
};

// Directional light gives the extruded buildings visible shading/depth instead of flat silhouettes
const LIGHT_PRESET: Record<MapTheme, maplibregl.LightSpecification> = {
  night: { anchor: 'viewport', color: '#8ec9ff', intensity: 0.45, position: [1.15, 210, 30] },
  day: { anchor: 'viewport', color: '#ffffff', intensity: 0.55, position: [1.15, 210, 60] }
};

// Custom MapLibre control: a small Day/Night toggle button docked next to the zoom controls
class ThemeToggleControl implements maplibregl.IControl {
  private container?: HTMLDivElement;

  constructor(
    private onToggle: () => void,
    private buttonRef: React.MutableRefObject<HTMLButtonElement | null>,
    private initialLabel: string
  ) {}

  onAdd() {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Toggle day / night map';
    button.style.width = 'auto';
    button.style.padding = '0 10px';
    button.style.fontSize = '12px';
    button.style.fontWeight = '700';
    button.style.whiteSpace = 'nowrap';
    button.textContent = this.initialLabel;
    button.onclick = this.onToggle;
    this.buttonRef.current = button;
    container.appendChild(button);
    this.container = container;
    return container;
  }

  onRemove() {
    this.container?.parentNode?.removeChild(this.container);
  }
}

export const MapView: React.FC<MapViewProps> = ({
  activities,
  selectedActivity,
  onSelectActivity,
  onOpenCheckInModal,
  currentTimeMinutes
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const popupsRef = useRef<{ [key: string]: maplibregl.Popup }>({});
  const styleReadyRef = useRef(false);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [theme, setTheme] = useState<MapTheme>('night');

  // Adds the 3D building extrusion, lighting and activity glow layers on top of whichever base style is active
  const setupStyleLayers = (map: maplibregl.Map, activeTheme: MapTheme) => {
    const labelLayer = map.getStyle().layers?.find(l => l.type === 'symbol');
    map.addLayer(
      {
        id: '3d-buildings',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': BUILDING_COLOR[activeTheme],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true
        }
      },
      labelLayer?.id
    );

    map.setLight(LIGHT_PRESET[activeTheme]);

    // Small translucent glow per busy spot instead of large overlapping circles
    map.addSource('activity-heat', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: 'activity-heat-layer',
      type: 'circle',
      source: 'activity-heat',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, ['*', ['get', 'weight'], 0.6], 16, ['*', ['get', 'weight'], 1.8]],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.08,
        'circle-blur': 0.8
      }
    });
  };

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE_URLS[theme],
      center: [-122.681071, 45.5103571], // 1818 SW 4th Ave, Portland, OR 97201
      zoom: 13,
      pitch: 50,
      bearing: -12,
      antialias: true,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(
      new ThemeToggleControl(() => setTheme(prev => (prev === 'night' ? 'day' : 'night')), themeButtonRef, '🌙 Night'),
      'top-right'
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setupStyleLayers(map, theme);
      styleReadyRef.current = true;
      renderActivityLayersRef.current();
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      styleReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the base style when the user toggles day/night, then re-attach our custom layers
  const isFirstThemeRun = useRef(true);
  useEffect(() => {
    if (themeButtonRef.current) {
      themeButtonRef.current.textContent = theme === 'night' ? '🌙 Night' : '☀️ Day';
    }

    if (isFirstThemeRun.current) {
      isFirstThemeRun.current = false;
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    styleReadyRef.current = false;
    map.setStyle(STYLE_URLS[theme]);
    map.once('style.load', () => {
      setupStyleLayers(map, theme);
      styleReadyRef.current = true;
      renderActivityLayersRef.current();
    });
  }, [theme]);

  // Helper to check open status
  const isPOIOpen = (act: PDXActivity) => {
    const hours = Math.floor(currentTimeMinutes / 60);
    const startHour = parseInt(act.openHours.start.split(':')[0], 10);
    let endHour = parseInt(act.openHours.end.split(':')[0], 10);
    if (endHour < startHour) endHour += 24;

    const currentCheck = (hours < startHour && startHour > 12) ? hours + 24 : hours;
    return currentCheck >= startHour && currentCheck < endHour;
  };

  const renderActivityLayers = () => {
    const map = mapInstanceRef.current;
    if (!map || !styleReadyRef.current) return;

    // Update the subtle glow layer (kept small & translucent so it never hides the map)
    const heatSource = map.getSource('activity-heat') as maplibregl.GeoJSONSource | undefined;
    if (heatSource) {
      const heatFeatures = activities
        .filter(act => act.activeUsersCount > 25)
        .map(act => ({
          type: 'Feature' as const,
          properties: {
            weight: Math.min(40, 12 + act.activeUsersCount * 0.35),
            color: CATEGORY_COLORS[act.category].bg
          },
          geometry: { type: 'Point' as const, coordinates: [act.lng, act.lat] }
        }));
      heatSource.setData({ type: 'FeatureCollection', features: heatFeatures });
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    popupsRef.current = {};

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

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="position: relative; transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'}; transition: transform 0.2s ease;">
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

      const popup = new maplibregl.Popup({ offset: 38, closeButton: true, maxWidth: '280px' }).setHTML(popupHtml);

      popup.on('open', () => {
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

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([act.lng, act.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectActivity(act);
      });

      markersRef.current[act.id] = marker;
      popupsRef.current[act.id] = popup;
    });
  };

  // Keep a ref to the latest render function so the map's 'load' handler (registered once) can call it
  const renderActivityLayersRef = useRef(renderActivityLayers);
  renderActivityLayersRef.current = renderActivityLayers;

  // Update Markers & Heat Glow whenever activities, selectedActivity or time change
  useEffect(() => {
    renderActivityLayers();
  }, [activities, selectedActivity, currentTimeMinutes]);

  // Center map on selectedActivity when clicked from list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedActivity) return;

    map.flyTo({
      center: [selectedActivity.lng, selectedActivity.lat],
      zoom: 15.5,
      pitch: 55,
      duration: 1200
    });

    const popup = popupsRef.current[selectedActivity.id];
    if (popup) {
      popup.addTo(map);
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
        <span>1818 SW 4th Ave, Portland, OR (45.5104° N, 122.6811° W)</span>
      </div>
    </div>
  );
};
