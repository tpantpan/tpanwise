
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
  
  // Remove excessive whitespace while preserving paragraph breaks
  const cleanText = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  
  // Skip title and author detection as requested by user
  
  // ADDED: Check for "HIGHLIGHT" markers to separate individual highlights
  const highlightMarkerPattern = /\bHIGHLIGHT\b/gi;
  
  if (text.match(highlightMarkerPattern)) {
    console.log("Detected HIGHLIGHT markers between content sections");
    
    // Split the content by HIGHLIGHT markers
    const segments = text.split(highlightMarkerPattern).map(s => s.trim()).filter(Boolean);
    
    // Skip the first segment if it looks like metadata/title (less than 100 characters and few lines)
    // This helps avoid including document title/author information
    const startIndex = (segments[0].length < 100 && segments[0].split('\n').length <= 3) ? 1 : 0;
    
    // Add each segment as a highlight
    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i].trim();
      
      // Skip very short segments that might be just page numbers or headers (at least 10 chars)
      if (segment.length > 10) {
        highlights.push(segment);
      }
    }
    
    if (highlights.length > 0) {
      console.log(`Found ${highlights.length} highlights using HIGHLIGHT markers`);
      return highlights;
    }
  }
  
  // Pattern for Kindle highlights: "Highlight (Yellow) | Page X" or just "(Yellow) | Page X"
  const kindleFormatPattern = /(?:Highlight\s*)?\(\w+\)\s*\|\s*Page\s+\d+/gi;
  
  if (text.match(kindleFormatPattern)) {
    console.log("Detected Kindle highlight format");
    
    // Extract highlights by finding content between Kindle format markers
    const extractedHighlights: string[] = [];
    
    // Split the text by the Kindle format markers
    const segments = text.split(kindleFormatPattern);
    
    // Skip the first segment if it looks like metadata/title
    const startIndex = (segments[0].length < 100 && segments[0].split('\n').length <= 3) ? 1 : 0;
    
    // Process the content segments (which follow the markers)
    for (let i = startIndex; i < segments.length; i++) {
      const content = segments[i].trim();
      if (content.length > 15) { // Skip very short content
        extractedHighlights.push(content);
      }
    }
    
    if (extractedHighlights.length > 0) {
      console.log(`Found ${extractedHighlights.length} highlights using Kindle format pattern`);
      return extractedHighlights;
    }
    
    // Alternative approach: match each highlight with its marker
    const matches = text.match(new RegExp(`(${kindleFormatPattern.source})([\\s\\S]*?)(?=${kindleFormatPattern.source}|$)`, 'gi'));
    
    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Find the Kindle marker in this match
        const markerMatch = match.match(kindleFormatPattern);
        
        if (markerMatch && markerMatch[0]) {
          // Extract content by removing the marker
          const content = match.substring(markerMatch[0].length).trim();
          
          if (content.length > 15) { // Skip very short content
            extractedHighlights.push(content);
          }
        }
      }
      
      if (extractedHighlights.length > 0) {
        console.log(`Found ${extractedHighlights.length} highlights using Kindle format regex matching`);
        return extractedHighlights;
      }
    }
  }
  
  // Check for horizontal line separators if previous methods aren't found
  const horizontalLinePattern = /\n\s*[-_=–—]{3,}\s*\n|\n\s*[-_]\s*\n/g;
  
  // If we can split by horizontal lines, do it
  if (text.match(horizontalLinePattern)) {
    console.log("Detected horizontal line separators between highlights");
    
    // Split the content by horizontal lines
    const segments = text.split(horizontalLinePattern).map(s => s.trim()).filter(Boolean);
    
    // Skip the first segment if it looks like metadata/title (less than 100 characters and few lines)
    // Explicitly skipping title/author information at the top
    const startIndex = (segments[0].length < 100 && segments[0].split('\n').length <= 3) ? 1 : 0;
    
    // Add each segment as a highlight
    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i].trim();
      
      // Skip very short segments that might be just page numbers or headers (at least 10 chars)
      if (segment.length > 10) {
        highlights.push(segment);
      }
    }
    
    if (highlights.length > 0) {
      console.log(`Found ${highlights.length} highlights using horizontal line separators`);
      return highlights;
    }
  }
  
  // If horizontal line detection didn't work, fall back to other detection methods
  
  // Pattern 1: Kindle notes format with page numbers
  // Example: "Highlight (Yellow) | Page 30" followed by the highlight text
  const kindleHighlightPattern = /Highlight\s+\(\w+\)\s*\|\s*Page\s+\d+/gi;
  
  if (text.match(kindleHighlightPattern)) {
    console.log("Identified Kindle notes format with page numbers");
    
    // Split by the highlight markers
    const segments = text.split(kindleHighlightPattern).filter(Boolean);
    
    // Skip the first segment if it appears to be metadata/title
    const startIndex = segments[0].includes("Kindle") || 
                       segments[0].includes("by ") || 
                       segments[0].length < 100 ? 1 : 0;
    
    // Process the actual highlights (skip title/metadata)
    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (segment.length > 15) { // Skip very short segments
        highlights.push(segment);
      }
    }
    
    if (highlights.length > 0) {
      return highlights;
    }
  }
  
  // Pattern 2: Kindle highlight markers with locations
  const locationHighlightPattern = /Highlight\s+\((?:Yellow|Blue|Pink|Orange|Green)\)\s*\|\s*Location\s+\d+/gi;
  if (text.match(locationHighlightPattern)) {
    const segments = text.split(locationHighlightPattern).filter(Boolean);
    // The first segment might be introductory text, not a highlight
    const startIndex = segments[0].includes("Kindle") || segments[0].length < 100 ? 1 : 0;
    
    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (segment.length > 15) { // Skip very short segments
        highlights.push(segment);
      }
    }
    return highlights;
  }
  
  // Pattern 3: Number of highlights header
  // Example: "73 Highlights | Yellow (73)"
  const highlightCountPattern = /(\d+)\s+Highlights?\s+\|\s+\w+\s+\(\d+\)/i;
  const highlightCountMatch = text.match(highlightCountPattern);
  
  if (highlightCountMatch) {
    console.log(`Detected ${highlightCountMatch[1]} highlights in document`);
    
    // If we found a header like "73 Highlights | Yellow (73)", 
    // look for patterns like "Highlight (Yellow) | Page X"
    const pageHighlightPattern = /Highlight\s+\(\w+\)\s*\|\s*Page\s+\d+/gi;
    const segments = text.split(pageHighlightPattern);
    
    // Skip the first segment as it's likely metadata
    if (segments.length > 1) {
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i].trim();
        if (segment.length > 15) {
          highlights.push(segment);
        }
      }
      
      if (highlights.length > 0) {
        return highlights;
      }
    }
  }

  // Pattern 4: Look for explicit numbered sections
  // Simple paragraphs separated by blank lines
  const paraPattern = /\n\s*\n/g; 
  const paragraphs = text.split(paraPattern).map(p => p.trim()).filter(Boolean);
  
  if (paragraphs.length > 1) {
    let currentParagraph = "";
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      
      // Skip very short paragraphs that might just be headers
      if (para.length < 15) {
        continue;
      }
      
      // Check if this paragraph has a "benefits" header
      if (para.match(/(\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+)/i)) {
        // If we have accumulated content, add it first
        if (currentParagraph) {
          highlights.push(currentParagraph.trim());
          currentParagraph = "";
        }
        
        // Start a new accumulation with this benefits header
        currentParagraph = para;
        
        // Check if the next paragraph is a numbered/bullet list that belongs to this header
        if (i + 1 < paragraphs.length && 
            (paragraphs[i+1].match(/^\s*\d+\.\s/) || 
             paragraphs[i+1].match(/^\s*[•\-*]\s/))) {
          // Continue in the loop - the next iteration will append this list to currentParagraph
          continue;
        }
      }
      // Check if this is a continuation of a list or structured content
      else if (para.match(/^\s*\d+\.\s/) || para.match(/^\s*[a-z]\.\s/) || 
               para.match(/^\s*[•\-*]\s/)) {
        // If we have no accumulated content, start with this
        if (!currentParagraph) {
          currentParagraph = para;
        }
        // Otherwise append to the current paragraph as it's part of the same structure
        else {
          currentParagraph += "\n" + para;
        }
      }
      // Regular paragraph
      else {
        // If we have accumulated content, add it first
        if (currentParagraph) {
          highlights.push(currentParagraph.trim());
          currentParagraph = "";
        }
        
        highlights.push(para);
      }
    }
    
    // Add any remaining accumulated content
    if (currentParagraph) {
      highlights.push(currentParagraph.trim());
    }
    
    if (highlights.length > 0) {
      console.log(`Found ${highlights.length} highlights using paragraph format`);
      return highlights;
    }
  }
  
  return highlights;
};

// Function to detect the format of the PDF
export const detectPDFFormat = (text: string): string | null => {
  // Check for HIGHLIGHT markers
  if (text.match(/\bHIGHLIGHT\b/gi)) {
    return "HIGHLIGHT Marker Format";
  }
  
  // Check for Kindle highlight pattern "(Yellow) | Page X" or "Highlight (Yellow) | Page X"
  if (text.match(/(?:Highlight\s*)?\(\w+\)\s*\|\s*Page\s+\d+/gi)) {
    return "Kindle Highlights Format";
  }
  
  // Check for horizontal line separators
  if (text.match(/\n\s*[-_=–—]{3,}\s*\n|\n\s*[-_]\s*\n/g)) {
    return "Horizontal Line Separated Format";
  }
  
  // Check for "X benefits of Y" pattern
  if (text.match(/\d+\s+benefits\s+of\s+\w+/i)) {
    return "Structured Document with Benefits Sections";
  }
  
  // Check for structured document with numbered sections
  if (text.match(/^\d+\.\s+.+?(?=\n\d+\.|$)/gms)) {
    return "Structured Document with Numbered Sections";
  }
  
  // Kindle notes format with page numbers
  if (text.match(/Highlight\s+\(\w+\)\s*\|\s*Page\s+\d+/gi)) {
    return "Kindle Notes (Page Format)";
  }
  
  // Kindle highlight markers with locations
  if (text.match(/Highlight\s+\((?:Yellow|Blue|Pink|Orange|Green)\)\s*\|\s*Location\s+\d+/gi)) {
    return "Kindle Notes (Location Format)";
  }
  
  // Number of highlights header (e.g., "73 Highlights | Yellow (73)")
  const highlightCountMatch = text.match(/(\d+)\s+Highlights?\s+\|\s+\w+\s+\(\d+\)/i);
  if (highlightCountMatch) {
    return `${highlightCountMatch[1]} Highlights Document`;
  }
  
  // Structured document with bullet points
  if (text.match(/(?:\n|\r\n?)\s*(?:•|\*|-|\d+\.)\s+/)) {
    return "Bullet Point Format";
  }
  
  return "General Text Format";
};
