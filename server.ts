import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes FIRST
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Pulse Map PDX" });
});

app.post("/api/recommend", async (req, res) => {
  try {
    const { timeFormatted, timeMinutes, persona, moods, budget, maxDistanceMiles, socialMode, activities } = req.body;

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing, providing smart local recommendations fallback.");
      return res.json({ recommendations: getFallbackRecommendations(activities, timeMinutes, moods, persona) });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `
You are the AI Recommendation Engine for "Pulse Map PDX", a real-time activity finder in Portland, Oregon.

Current Context:
- Time of Day: ${timeFormatted} (Minutes into day: ${timeMinutes})
- User Persona: ${persona?.name || 'Portland Local'} - ${persona?.tagline || ''}. Bio: ${persona?.bio || ''}. Interests: ${(persona?.interests || []).join(', ')}. Night owl level: ${persona?.nightOwlLevel || 'Balanced'}.
- Selected Moods: ${(moods || []).join(', ') || 'Any vibe'}
- Selected Budget Filter: ${budget || 'Any'}
- Maximum Distance: ${maxDistanceMiles || 10} miles
- Social Preference: ${socialMode || 'Any'}

Candidate Portland POIs:
${JSON.stringify((activities || []).map((a: any) => ({
  id: a.id,
  title: a.title,
  category: a.category,
  neighborhood: a.neighborhood,
  openHours: a.openHours,
  suitableMoods: a.suitableMoods,
  description: a.description,
  activeUsersCount: a.activeUsersCount,
  address: a.address,
  priceLevel: a.priceLevel,
  vibe: a.vibe,
  tags: a.tags
})), null, 2)}

Instructions:
1. Select the TOP 3 best activities to do RIGHT NOW in Portland that best match the current time, user's persona, moods, budget, and social preference.
2. Ensure open hours align or provide a clever late-night/early-morning rationale if open or live now.
3. Provide a personalized reason explaining why it fits this specific persona and current time/mood.
4. Provide a concrete, actionable "suggestedAction" (e.g. "Order the Potato Champion poutine and sit near the fire pit").
5. Describe the crowd vibe right now.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert, local Portland concierges who knows all the hidden gems, late night spots, coffee shops, tech hackathons, and sports pickups in PDX. Always output structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              description: "Top 3 ranked recommendations",
              items: {
                type: Type.OBJECT,
                properties: {
                  activityId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  fitScore: { type: Type.NUMBER, description: "Match percentage 0 to 100" },
                  reason: { type: Type.STRING, description: "Detailed persona and time fit explanation" },
                  suggestedAction: { type: Type.STRING, description: "Specific action to take at the location" },
                  crowdVibe: { type: Type.STRING, description: "Live atmosphere and crowd vibe" },
                  bestTimeNote: { type: Type.STRING, description: "Why right now is the prime time" }
                },
                required: ["activityId", "title", "fitScore", "reason", "suggestedAction", "crowdVibe", "bestTimeNote"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } else {
      return res.json({ recommendations: getFallbackRecommendations(activities, timeMinutes, moods, persona) });
    }
  } catch (error) {
    console.error("Gemini recommendation error:", error);
    // Return fallback smart recommendations on error
    const { activities, timeMinutes, moods, persona } = req.body;
    return res.json({ recommendations: getFallbackRecommendations(activities || [], timeMinutes || 120, moods || [], persona) });
  }
});

// Smart Fallback generator in case API key is absent or network fails
function getFallbackRecommendations(activities: any[], timeMinutes: number, moods: string[], persona: any) {
  if (!activities || activities.length === 0) return [];

  // Convert time to hours
  const hours = Math.floor(timeMinutes / 60);

  // Score candidate activities based on open hours, mood matching, active users
  const scored = activities.map(act => {
    let score = 70;

    // Open hours check
    const startHour = parseInt(act.openHours.start.split(':')[0], 10);
    let endHour = parseInt(act.openHours.end.split(':')[0], 10);
    if (endHour < startHour) endHour += 24; // spans past midnight

    const currentCheck = (hours < startHour && startHour > 12) ? hours + 24 : hours;
    const isOpen = currentCheck >= startHour && currentCheck < endHour;

    if (isOpen) score += 15;
    if (act.isLiveNow) score += 10;

    // Mood match
    if (moods && moods.length > 0) {
      const matchCount = act.suitableMoods.filter((m: string) => moods.some(sel => m.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(m.toLowerCase()))).length;
      score += matchCount * 12;
    }

    // Persona match
    if (persona && persona.preferredCategories) {
      if (persona.preferredCategories.includes(act.category)) score += 10;
    }

    // Social pulse boost
    score += Math.min(10, Math.floor(act.activeUsersCount / 5));

    return { ...act, score: Math.min(99, score) };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(act => ({
    activityId: act.id,
    title: act.title,
    fitScore: act.score,
    reason: `Fits your ${persona?.name || 'Portlander'} profile and current vibe in ${act.neighborhood}.`,
    suggestedAction: `Head over to ${act.neighborhood} for ${act.title}. ${act.featuredHighlight || 'Great atmosphere right now!'}`,
    crowdVibe: `${act.vibe} with ~${act.activeUsersCount} active Portlanders checked in.`,
    bestTimeNote: `Active hours: ${act.openHours.start} - ${act.openHours.end}.`
  }));
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pulse Map PDX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
