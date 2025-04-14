
export interface Highlight {
  id: string;
  text: string;
  author?: string;
  source?: string;
  category?: string;
  dateAdded: Date;
  favorite: boolean;
  imageData?: string; // Base64 encoded image data
}

export type EmailFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface EmailSettings {
  email: string;
  frequency: EmailFrequency;
  enabled: boolean;
  lastSent?: Date;
  deliveryTime?: string;
  highlightCount?: number;
}

export type RandomHighlightReturn = Highlight | Highlight[] | null;
