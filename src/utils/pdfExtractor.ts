
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
  
  // Pattern 4: If nothing else worked, try to identify complete sentences or thoughts
  if (highlights.length <= 1 && text.length > 200) {
    // First try to split by common sentence endings
    const sentencePattern = /(?<=[.!?])\s+(?=[A-Z])/g;
    let sentences = text.split(sentencePattern).filter(Boolean);
    
    // Improved sentence extraction - ensure we have complete sentences
    // If we have incomplete sentences that start midway, try to combine them into meaningful units
    if (sentences.length > 0) {
      const improvedSentences: string[] = [];
      let currentSentence = '';
      
      for (const sentence of sentences) {
        // Check if this sentence starts with lowercase (indicating incomplete sentence) 
        // and there's no punctuation at the end of our current accumulator
        if (/^[a-z]/.test(sentence) && !currentSentence.match(/[.!?]$/)) {
          currentSentence += ' ' + sentence;
        } else {
          // If we have accumulated content, add it first
          if (currentSentence) {
            improvedSentences.push(currentSentence.trim());
            currentSentence = '';
          }
          currentSentence = sentence;
        }
      }
      
      // Add the last sentence if any
      if (currentSentence) {
        improvedSentences.push(currentSentence.trim());
      }
      
      sentences = improvedSentences;
    }
    
    // Group sentences into reasonable chunks (3-4 sentences per highlight)
    const sentencesPerChunk = 3;
    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
      const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
      if (chunk.trim().length > 15) {
        // Check if the chunk starts with a capital letter, otherwise try to find a complete sentence
        if (/^[A-Z]/.test(chunk.trim())) {
          highlights.push(chunk.trim());
        } else {
          // Try to find the first complete sentence
          const match = chunk.match(/[A-Z][^.!?]*[.!?]/);
          if (match) {
            highlights.push(match[0].trim());
          } else {
            highlights.push(chunk.trim());
          }
        }
      }
    }
  }
  
  return highlights;
};
