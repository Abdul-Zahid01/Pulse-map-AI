import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { PersonaBanner } from './components/PersonaBanner';
import { SidebarControls, MOOD_BADGES } from './components/SidebarControls';
import { AIRecommendationsCard } from './components/AIRecommendationsCard';
import { ActivityCardList } from './components/ActivityCardList';
import { MapView } from './components/MapView';
import { ActivityModal } from './components/ActivityModal';
import { PersonaModal } from './components/PersonaModal';

import { PDX_ACTIVITIES } from './data/pdxActivities';
import { PORTLAND_PERSONAS } from './data/personas';
import { PDXActivity, PersonaProfile, UserFilters, AIRecommendation, CategoryType } from './types';
import { haversineMiles, PORTLAND_DOWNTOWN_CENTER } from './utils/geo';

// Which categories reasonably fit a solo visit vs. a group outing, used by the Group Size filter
const CATEGORY_SOCIAL_FIT: Record<CategoryType, Array<'solo' | 'group'>> = {
  food: ['solo', 'group'],
  tech_events: ['solo', 'group'],
  markets: ['solo', 'group'],
  sports: ['group'],
  nightlife: ['group'],
  social: ['group']
};

export default function App() {
  // Default simulated time: 2:15 AM (135 mins) or actual time
  const [timeMinutes, setTimeMinutes] = useState<number>(135);
  const [isRealtimeSync, setIsRealtimeSync] = useState<boolean>(false);

  // Active Persona (Default to Alex)
  const [activePersona, setActivePersona] = useState<PersonaProfile>(PORTLAND_PERSONAS[0]);
  const [isCustomPersona, setIsCustomPersona] = useState<boolean>(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState<boolean>(false);

  // Filter State
  const [filters, setFilters] = useState<UserFilters>({
    timeMinutes: 135,
    selectedMoods: ['Late Night Craving 🍕', 'Tech & Coding 💻'],
    maxDistanceMiles: 8,
    selectedCategories: [],
    budgetFilter: 'all',
    socialMode: 'all',
    searchQuery: '',
    onlyOpenNow: false,
    sortBy: 'distance',
    minRating: 0,
    selectedCuisines: []
  });

  // Sync filters.timeMinutes with header time slider
  useEffect(() => {
    setFilters(prev => ({ ...prev, timeMinutes }));
  }, [timeMinutes]);

  // Selected POI for Map center & Popup
  const [selectedActivity, setSelectedActivity] = useState<PDXActivity | null>(null);

  // Activity Modal State
  const [modalActivity, setModalActivity] = useState<PDXActivity | null>(null);
  const [checkIns, setCheckIns] = useState<Record<string, boolean>>({});

  // AI Recommendation State
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);

  // Activities Data State (support live social incrementing)
  const [activitiesList, setActivitiesList] = useState<PDXActivity[]>(PDX_ACTIVITIES);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(true);
  const [placesSource, setPlacesSource] = useState<'live' | 'demo'>('demo');

  // Load real Downtown Portland venues from OpenStreetMap on mount; keep the demo list if it fails
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/places');
        const data = await response.json();
        if (!cancelled && Array.isArray(data.activities) && data.activities.length > 0) {
          setActivitiesList(data.activities);
          setPlacesSource('live');
        }
      } catch (err) {
        console.error('Failed to load live Downtown Portland places, using demo data:', err);
      } finally {
        if (!cancelled) setIsLoadingPlaces(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    const withDistance = activitiesList.map(act => ({
      ...act,
      distanceMiles: haversineMiles(PORTLAND_DOWNTOWN_CENTER.lat, PORTLAND_DOWNTOWN_CENTER.lng, act.lat, act.lng)
    }));

    const filtered = withDistance.filter(act => {
      // Category match (multi-select; empty = all categories)
      if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(act.category)) {
        return false;
      }

      // Mood match (any overlap between selected moods and the place's suitable moods)
      if (filters.selectedMoods.length > 0) {
        const hasMoodMatch = act.suitableMoods.some(m => filters.selectedMoods.includes(m));
        if (!hasMoodMatch) return false;
      }

      // Distance match
      if (act.distanceMiles !== undefined && act.distanceMiles > filters.maxDistanceMiles) {
        return false;
      }

      // Group size match
      if (filters.socialMode !== 'all' && !CATEGORY_SOCIAL_FIT[act.category].includes(filters.socialMode)) {
        return false;
      }

      // Budget match
      if (filters.budgetFilter !== 'all') {
        if (filters.budgetFilter === 'Free' && act.priceLevel !== 'Free') return false;
        if (filters.budgetFilter === '$' && act.priceLevel !== '$' && act.priceLevel !== 'Free') return false;
        if (filters.budgetFilter === '$$' && act.priceLevel === '$$$') return false;
      }

      // Minimum rating match
      if (filters.minRating > 0 && act.rating < filters.minRating) {
        return false;
      }

      // Cuisine match (only constrains food places; other categories are unaffected)
      if (filters.selectedCuisines.length > 0 && act.category === 'food') {
        const cuisineTokens = act.cuisine ? act.cuisine.split(', ') : [];
        if (!cuisineTokens.some(c => filters.selectedCuisines.includes(c))) return false;
      }

      // Open now filter
      if (filters.onlyOpenNow) {
        const hours = Math.floor(filters.timeMinutes / 60);
        const startHour = parseInt(act.openHours.start.split(':')[0], 10);
        let endHour = parseInt(act.openHours.end.split(':')[0], 10);
        if (endHour < startHour) endHour += 24;
        const currentCheck = (hours < startHour && startHour > 12) ? hours + 24 : hours;
        const isOpen = currentCheck >= startHour && currentCheck < endHour;
        if (!isOpen) return false;
      }

      // Search query match
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesNeighborhood = act.neighborhood.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesTags = act.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNeighborhood && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'popularity') return b.activeUsersCount - a.activeUsersCount;
      return (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0);
    });

    return sorted;
  }, [activitiesList, filters]);

  // Calculate Total Active Portlanders
  const totalActiveUsers = useMemo(() => {
    return activitiesList.reduce((sum, a) => sum + a.activeUsersCount, 0);
  }, [activitiesList]);

  // Distinct cuisines present in the current data, used to populate the Cuisine filter dropdown
  const availableCuisines = useMemo(() => {
    const cuisines = new Set<string>();
    activitiesList.forEach(act => {
      if (act.category === 'food' && act.cuisine) {
        act.cuisine.split(', ').forEach(c => cuisines.add(c));
      }
    });
    return Array.from(cuisines).sort();
  }, [activitiesList]);

  // Trigger AI Recommendation API Call
  const handleGetAIRecommendations = async () => {
    setIsLoadingAI(true);
    setAiRecommendations([]);

    // Format current time
    const hours = Math.floor(filters.timeMinutes / 60);
    const mins = filters.timeMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMins = mins < 10 ? `0${mins}` : mins;
    const timeFormatted = `${displayHours}:${displayMins} ${period}`;

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeFormatted,
          timeMinutes: filters.timeMinutes,
          persona: activePersona,
          moods: filters.selectedMoods,
          budget: filters.budgetFilter,
          maxDistanceMiles: filters.maxDistanceMiles,
          socialMode: filters.socialMode,
          activities: filteredActivities
        })
      });

      const data = await response.json();
      if (data && data.recommendations) {
        setAiRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to get AI recommendations:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Handle Social Check-In Simulation
  const handleToggleCheckIn = (activityId: string) => {
    setCheckIns(prev => {
      const isAlreadyCheckedIn = !!prev[activityId];
      const newStatus = !isAlreadyCheckedIn;

      // Update active user count
      setActivitiesList(list => list.map(a => {
        if (a.id === activityId) {
          return {
            ...a,
            activeUsersCount: newStatus ? a.activeUsersCount + 1 : Math.max(1, a.activeUsersCount - 1)
          };
        }
        return a;
      }));

      return { ...prev, [activityId]: newStatus };
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setTimeMinutes(135); // 2:15 AM
    setFilters({
      timeMinutes: 135,
      selectedMoods: ['Late Night Craving 🍕', 'Tech & Coding 💻'],
      maxDistanceMiles: 8,
      selectedCategories: [],
      budgetFilter: 'all',
      socialMode: 'all',
      searchQuery: '',
      onlyOpenNow: false,
      sortBy: 'distance',
      minRating: 0,
      selectedCuisines: []
    });
    setAiRecommendations([]);
    setSelectedActivity(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Header */}
      <Header
        timeFormatted=""
        timeMinutes={filters.timeMinutes}
        setTimeMinutes={(m) => {
          setTimeMinutes(m);
          setIsRealtimeSync(false);
        }}
        activePersona={activePersona}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onResetFilters={handleResetFilters}
        totalActiveUsers={totalActiveUsers}
        isRealtimeSync={isRealtimeSync}
        setIsRealtimeSync={setIsRealtimeSync}
      />

      {/* Main 2-Column Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        {/* Left Sidebar (~35% Width): AI Controls, Persona & Activity Feed */}
        <section className="w-full lg:w-[38%] xl:w-[35%] lg:h-full flex flex-col border-r border-slate-800 bg-slate-950/95 z-20 lg:overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Persona Profile Banner */}
          <PersonaBanner
            activePersona={activePersona}
            setActivePersona={(p) => {
              setActivePersona(p);
              setIsCustomPersona(false);
            }}
            isCustomized={isCustomPersona}
            onOpenModal={() => setIsPersonaModalOpen(true)}
          />

          {/* Live Data Source Indicator */}
          <div className={`flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-xl border ${
            isLoadingPlaces
              ? 'bg-slate-900/80 border-slate-800 text-slate-400'
              : placesSource === 'live'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLoadingPlaces ? 'bg-slate-500 animate-pulse' : placesSource === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isLoadingPlaces
              ? 'Loading real Downtown Portland places...'
              : placesSource === 'live'
                ? 'Live venues from OpenStreetMap (Downtown Portland)'
                : 'Live data unavailable — showing demo places'}
          </div>

          {/* Context & Mood Inputs */}
          <SidebarControls
            filters={filters}
            setFilters={setFilters}
            onGetAIRecommendations={handleGetAIRecommendations}
            isLoadingAI={isLoadingAI}
            availableCuisines={availableCuisines}
          />

          {/* AI Recommendations Card */}
          <AIRecommendationsCard
            recommendations={aiRecommendations}
            activities={activitiesList}
            onSelectActivity={(act) => setSelectedActivity(act)}
            onClearAI={() => setAiRecommendations([])}
          />

          {/* Filtered Activity Cards Feed */}
          <ActivityCardList
            activities={filteredActivities}
            selectedActivity={selectedActivity}
            onSelectActivity={(act) => setSelectedActivity(act)}
            searchQuery={filters.searchQuery}
            setSearchQuery={(q) => setFilters(prev => ({ ...prev, searchQuery: q }))}
            currentTimeMinutes={filters.timeMinutes}
          />
        </section>

        {/* Right Panel (~65% Width): Interactive Snapchat Map */}
        <section className="flex-1 h-[60vh] min-h-[320px] lg:h-full relative z-10">
          <MapView
            activities={filteredActivities}
            selectedActivity={selectedActivity}
            onSelectActivity={(act) => setSelectedActivity(act)}
            onOpenCheckInModal={(act) => setModalActivity(act)}
            currentTimeMinutes={filters.timeMinutes}
          />
        </section>
      </main>

      {/* Activity Details & Social Check-In Modal */}
      {modalActivity && (
        <ActivityModal
          activity={modalActivity}
          onClose={() => setModalActivity(null)}
          onCheckIn={handleToggleCheckIn}
          hasCheckedIn={!!checkIns[modalActivity.id]}
        />
      )}

      {/* Persona Customizer Modal */}
      {isPersonaModalOpen && (
        <PersonaModal
          currentPersona={activePersona}
          onSavePersona={(updated) => {
            setActivePersona(updated);
            setIsCustomPersona(true);
          }}
          onClose={() => setIsPersonaModalOpen(false)}
        />
      )}
    </div>
  );
}
