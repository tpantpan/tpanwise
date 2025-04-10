
export interface Highlight {
  id: string;
  text: string;
  source: string;
  author: string;
  category: string;
  dateAdded: Date;
  favorite: boolean;
}

export type EmailFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface EmailSettings {
  email: string;
  frequency: EmailFrequency;
  enabled: boolean;
  lastSent?: Date;
  deliveryTime: string; // Format: "HH:MM" in 24-hour format
  highlightCount?: number; // Number of highlights to send in each email (1-10)
}

// Define the return type for the getRandomHighlight function
export type RandomHighlightReturn = Highlight | Highlight[] | null;
