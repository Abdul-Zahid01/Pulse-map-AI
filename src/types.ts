export type CategoryType = 'food' | 'sports' | 'tech_events' | 'markets' | 'nightlife' | 'social';

export interface PDXActivity {
  id: string;
  title: string;
  category: CategoryType;
  neighborhood: string;
  lat: number;
  lng: number;
  openHours: { start: string; end: string }; // e.g. "22:00", "04:00" or "00:00", "23:59"
  suitableMoods: string[];
  description: string;
  isLiveNow?: boolean;
  activeUsersCount: number; // Snapchat map social pulse
  address: string;
  priceLevel: '$' | '$$' | '$$$' | 'Free';
  tags: string[];
  vibe: string;
  rating: number;
  featuredHighlight?: string;
  distanceMiles?: number;
  cuisine?: string; // only present for food category places, sourced from real OSM data when available
}

export interface PersonaProfile {
  id: string;
  name: string;
  age: number;
  tagline: string;
  bio: string;
  preferredCategories: CategoryType[];
  favNeighborhoods: string[];
  nightOwlLevel: 'Early Riser' | 'Balanced' | 'Night Owl' | '24/7 Insomniac';
  interests: string[];
  avatarEmoji: string;
}

export interface UserFilters {
  timeMinutes: number; // 0 to 1439 minutes in day
  selectedMoods: string[];
  maxDistanceMiles: number;
  selectedCategories: CategoryType[];
  budgetFilter: string; // 'all' | '$' | '$$' | '$$$' | 'Free'
  socialMode: 'all' | 'solo' | 'group';
  searchQuery: string;
  onlyOpenNow: boolean;
  sortBy: 'distance' | 'rating' | 'popularity';
  minRating: number; // 0 = no minimum
  selectedCuisines: string[]; // empty = all cuisines
}

export interface AIRecommendation {
  activityId: string;
  title: string;
  fitScore: number; // 0-100
  reason: string;
  suggestedAction: string;
  crowdVibe: string;
  bestTimeNote: string;
}

export interface SocialCheckIn {
  activityId: string;
  userCount: number;
  recentCheckIns: { name: string; avatar: string; timeAgo: string; note: string }[];
}
