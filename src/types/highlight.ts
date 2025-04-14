
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
