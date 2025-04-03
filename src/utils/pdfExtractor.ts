
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface HighlightCandidate {
  text: string;
  selected: boolean;
}

// Parse PDF and extract text content
export const extractTextFromPDF = async (file: File): Promise<string> => {
  // Read the file as an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  // Process each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str);
    
    // Join all text from the page
    const text = textItems.join(' ');
    fullText += text + '\n\n';
  }
  
  return fullText;
};

// Function to extract individual highlights from text
export const extractHighlights = (text: string): string[] => {
  const highlights: string[] = [];
  
  // Pattern 1: Split by highlight indicators like "Highlight (Yellow) | Location X"
  const highlightPattern = /Highlight\s+\((?:Yellow|Blue|Pink|Orange|Green)\)\s*\|\s*Location\s+\d+/gi;
  if (text.match(highlightPattern)) {
    const segments = text.split(highlightPattern).filter(Boolean);
    // The first segment might be introductory text, not a highlight
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (segment.length > 15) { // Skip very short segments
        highlights.push(segment);
      }
    }
    return highlights;
  }
  
  // Pattern 2: Split by bullet points and numbered lists
  const bulletPattern = /(?:\n|\r\n?)\s*(?:•|\*|-|\d+\.)\s+/;
  if (text.match(bulletPattern)) {
    const segments = text.split(bulletPattern).filter(Boolean);
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (trimmed.length > 15) { // Skip very short segments
        highlights.push(trimmed);
      }
    }
    
    if (highlights.length > 0) {
      return highlights;
    }
  }
  
  // Pattern 3: Split by paragraph breaks (empty lines)
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length > 15) { // Skip very short paragraphs
      highlights.push(trimmed);
    }
  }
  
  // If we still don't have meaningful highlights, try to break by sentences
  if (highlights.length <= 1 && text.length > 200) {
    const sentencePattern = /(?<=[.!?])\s+(?=[A-Z])/g;
    const sentences = text.split(sentencePattern).filter(Boolean);
    
    // Group sentences into reasonable chunks (3-4 sentences per highlight)
    const sentencesPerChunk = 3;
    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
      const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
      if (chunk.trim().length > 15) {
        highlights.push(chunk.trim());
      }
    }
  }
  
  return highlights;
};
