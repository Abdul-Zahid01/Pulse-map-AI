import { PersonaProfile } from '../types';

export const PORTLAND_PERSONAS: PersonaProfile[] = [
  {
    id: 'alex-dev-nightowl',
    name: 'Alex (Default)',
    age: 28,
    tagline: '28 y/o Dev & Night Owl',
    bio: 'Loves late-night food cart pods, 24/7 bouldering & pickup hoops, tech hackathons, and specialty coffee.',
    preferredCategories: ['food', 'tech_events', 'sports', 'nightlife'],
    favNeighborhoods: ['Central Eastside', 'SE Hawthorne', 'Pearl District', 'Alberta Arts'],
    nightOwlLevel: '24/7 Insomniac',
    interests: ['Late-night eats', 'TypeScript', 'Bouldering', 'Indie Arcade', 'Midnight hoops'],
    avatarEmoji: '🦉'
  },
  {
    id: 'maya-creative-outdoors',
    name: 'Maya',
    age: 25,
    tagline: '25 y/o Graphic Designer & Coffee Enthusiast',
    bio: 'Passionate about Saturday markets, matcha pop-ups, vintage record shops, Forest Park trail runs, and art walks.',
    preferredCategories: ['markets', 'social', 'food', 'sports'],
    favNeighborhoods: ['Alberta Arts', 'NW 23rd', 'Division St', 'St. Johns'],
    nightOwlLevel: 'Early Riser',
    interests: ['Farmers markets', 'Matcha lattes', 'Vinyl listening', 'Trail running', 'Local art'],
    avatarEmoji: '🌿'
  },
  {
    id: 'sam-social-connector',
    name: 'Sam & Jordan',
    age: 31,
    tagline: '31 y/o Social Connectors & Craft Beer Aficionados',
    bio: 'Always seeking communal patio beer gardens, pub trivia, board game socials, and live indie music sets.',
    preferredCategories: ['social', 'nightlife', 'food', 'markets'],
    favNeighborhoods: ['Mississippi Ave', 'SE Belmont', 'Downtown PDX', 'Buckman'],
    nightOwlLevel: 'Balanced',
    interests: ['Craft IPAs', 'Pub trivia', 'Board game lounges', 'Live music', 'Food cart pods'],
    avatarEmoji: '🍻'
  }
];
