
import { Highlight, EmailSettings, EmailFrequency } from '@/types/highlight';

// Local storage keys
const HIGHLIGHTS_KEY = 'sparkler_highlights';
const EMAIL_SETTINGS_KEY = 'sparkler_email_settings';

// Initial sample data
const initialHighlights: Highlight[] = [
  {
    id: '1',
    text: "The person who reads too much and uses their brain too little will fall into lazy habits of thinking.",
    source: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Psychology",
    dateAdded: new Date(2023, 5, 12),
    favorite: true
  },
  {
    id: '2',
    text: "Be fearful when others are greedy and greedy when others are fearful.",
    source: "Letter to Shareholders",
    author: "Warren Buffett",
    category: "Finance",
    dateAdded: new Date(2023, 7, 25),
    favorite: false
  },
  {
    id: '3',
    text: "It's not that I'm so smart, it's just that I stay with problems longer.",
    source: "Einstein: His Life and Universe",
    author: "Albert Einstein",
    category: "Science",
    dateAdded: new Date(2023, 8, 5),
    favorite: true
  }
];

// Load highlights from local storage or use initial data
export const loadHighlights = (): Highlight[] => {
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((highlight: any) => ({
      ...highlight,
      dateAdded: new Date(highlight.dateAdded)
    }));
  }
  
  // Use initial data if nothing is stored
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(initialHighlights));
  return initialHighlights;
};

// Save highlights to local storage
export const saveHighlights = (highlights: Highlight[]): void => {
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
};

// Add a new highlight
export const addHighlight = (highlight: Omit<Highlight, 'id' | 'dateAdded'>): void => {
  const highlights = loadHighlights();
  const newHighlight: Highlight = {
    ...highlight,
    id: Date.now().toString(),
    dateAdded: new Date(),
  };
  
  saveHighlights([newHighlight, ...highlights]);
};

// Update a highlight
export const updateHighlight = (highlight: Highlight): void => {
  const highlights = loadHighlights();
  const index = highlights.findIndex(h => h.id === highlight.id);
  
  if (index !== -1) {
    highlights[index] = highlight;
    saveHighlights(highlights);
  }
};

// Delete a highlight
export const deleteHighlight = (id: string): void => {
  const highlights = loadHighlights();
  saveHighlights(highlights.filter(h => h.id !== id));
};

// Toggle favorite status
export const toggleFavorite = (id: string): void => {
  const highlights = loadHighlights();
  const highlight = highlights.find(h => h.id === id);
  
  if (highlight) {
    highlight.favorite = !highlight.favorite;
    saveHighlights(highlights);
  }
};

// Get a random highlight
export const getRandomHighlight = (): Highlight | null => {
  const highlights = loadHighlights();
  if (highlights.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * highlights.length);
  return highlights[randomIndex];
};

// Email settings functions
export const getDefaultEmailSettings = (): EmailSettings => {
  return {
    email: '',
    frequency: 'daily',
    enabled: false
  };
};

export const loadEmailSettings = (): EmailSettings => {
  const stored = localStorage.getItem(EMAIL_SETTINGS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      lastSent: parsed.lastSent ? new Date(parsed.lastSent) : undefined
    };
  }
  return getDefaultEmailSettings();
};

export const saveEmailSettings = (settings: EmailSettings): void => {
  localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
};

// Function to simulate sending an email (in a real app, this would be a backend function)
export const sendHighlightByEmail = async (): Promise<boolean> => {
  const settings = loadEmailSettings();
  if (!settings.enabled || !settings.email) {
    return false;
  }
  
  const highlight = getRandomHighlight();
  if (!highlight) {
    return false;
  }
  
  // In a real application, this would connect to a backend API
  console.log(`Sending highlight to ${settings.email}:`, highlight);
  
  // Update last sent date
  settings.lastSent = new Date();
  saveEmailSettings(settings);
  
  return true;
};

// Get next scheduled date based on frequency
export const getNextScheduledDate = (settings: EmailSettings): Date | null => {
  if (!settings.enabled || !settings.email) {
    return null;
  }
  
  const now = new Date();
  const lastSent = settings.lastSent || now;
  const nextDate = new Date(lastSent);
  
  switch (settings.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};
