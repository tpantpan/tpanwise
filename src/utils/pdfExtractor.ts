
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
  let detectedFormat: string | null = null;
  
  // Remove extra whitespace and normalize line breaks
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  
  // First detect if this is a title/author document header (common in many formats)
  // We'll look for patterns like "Title\nAuthor" at the beginning of the document
  const titleAuthorPattern = /^(.{1,100})\n(.{1,50})\n/;
  const headerMatch = text.match(titleAuthorPattern);
  let contentStartIndex = 0;
  
  if (headerMatch) {
    // Skip the title/author section for processing
    contentStartIndex = headerMatch[0].length;
    console.log("Detected title and author at start of document, skipping for highlight extraction");
  }
  
  // Pattern 1: Kindle notes format with page numbers
  // Example: "Highlight (Yellow) | Page 30" followed by the highlight text
  const kindleHighlightPattern = /Highlight\s+\(\w+\)\s*\|\s*Page\s+\d+/gi;
  
  if (text.match(kindleHighlightPattern)) {
    console.log("Identified Kindle notes format with page numbers");
    detectedFormat = "Kindle Notes (Page Format)";
    
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
    detectedFormat = "Kindle Notes (Location Format)";
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
    detectedFormat = `${highlightCountMatch[1]} Highlights Document`;
    
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

  // Pattern 4: Structured document with numbered sections and bullet points
  if (text.match(/^\d+\.\s+.+?\n/m) || text.match(/^\s*•\s+.+?\n/m)) {
    detectedFormat = "Structured Document with Bullet Points";
    
    // Try to detect structured lists with multi-level bullets (like in the screenshots)
    const structuredPattern = /(?:\d+\.|\s*[a-z]\.|\s*[ivxlcdm]+\.|\s*•|\s*-)\s+(.+?)(?=\n(?:\d+\.|\s*[a-z]\.|\s*[ivxlcdm]+\.|\s*•|\s*-)|$)/gis;
    const structuredMatches = Array.from(text.matchAll(structuredPattern));
    
    if (structuredMatches.length > 0) {
      // Get the parent-child relationships for nested bullet points
      let currentParent: string | null = null;
      let currentHighlight = "";
      
      for (const match of structuredMatches) {
        const content = match[0].trim();
        
        // Detect if this is a main bullet or a sub-bullet
        const isMainPoint = content.match(/^\d+\./);
        const isSubPoint = content.match(/^\s*[a-z]\./);
        const isSubSubPoint = content.match(/^\s*[ivxlcdm]+\./);
        
        if (isMainPoint) {
          // If we had a previous highlight, add it
          if (currentHighlight) {
            highlights.push(currentHighlight.trim());
            currentHighlight = "";
          }
          currentParent = content;
          currentHighlight = content;
        } else if (isSubPoint || isSubSubPoint) {
          // This is a sub-point of the main bullet, append to current highlight
          if (currentHighlight) {
            currentHighlight += "\n" + content;
          } else {
            // If somehow we got a sub-point without a parent
            currentHighlight = content;
          }
        } else {
          // Independent bullet point
          if (currentHighlight) {
            highlights.push(currentHighlight.trim());
          }
          currentHighlight = content;
        }
      }
      
      // Add the last highlight if it exists
      if (currentHighlight) {
        highlights.push(currentHighlight.trim());
      }
      
      if (highlights.length > 0) {
        return highlights;
      }
    }
  }
  
  // Pattern 5: Normal text with underlined/highlighted sections
  // In PDFs with underlined or highlighted text, we often see special characters or
  // formatting that might get extracted differently
  const paragraphs = text.substring(contentStartIndex).split(/\n\s*\n/).filter(Boolean);
  
  // Filter out obvious title/metadata sections
  const contentParagraphs = paragraphs.filter(p => {
    const normalizedP = p.toLowerCase();
    const isTitleOrMetadata = 
      normalizedP.includes("copyright") ||
      normalizedP.match(/^chapter\s+\d+$/) ||
      normalizedP.match(/^\s*page\s+\d+\s*$/);
    
    return !isTitleOrMetadata;
  });
  
  // Content after the title, likely actual highlights
  if (contentParagraphs.length > 0) {
    // If we have underlined segments (common in some PDF exports)
    const underlinedPattern = /[^\.\n]{20,}[\.!\?]/g;
    let foundHighlights = false;
    
    for (const paragraph of contentParagraphs) {
      const trimmed = paragraph.trim();
      
      // Skip short paragraphs or ones that look like headers
      if (trimmed.length < 15 || /^[A-Z\s]{5,30}$/.test(trimmed)) {
        continue; 
      }
      
      // Check if this paragraph contains underlined segments
      const underlinedMatches = trimmed.match(underlinedPattern);
      if (underlinedMatches && underlinedMatches.length > 0) {
        foundHighlights = true;
        for (const match of underlinedMatches) {
          highlights.push(match.trim());
        }
      } else if (trimmed.length > 25) {
        // Treat longer paragraphs as complete thoughts/highlights
        foundHighlights = true;
        highlights.push(trimmed);
      }
    }
    
    if (foundHighlights) {
      detectedFormat = "Text with Highlighted Passages";
      return highlights;
    }
  }
  
  // Pattern 6: Bullet points with dash or asterisk
  const bulletPattern = /(?:\n|\r\n?)\s*(?:•|\*|-|\d+\.)\s+/;
  if (text.match(bulletPattern)) {
    detectedFormat = "Bullet Point Format";
    const segments = text.split(bulletPattern).filter(Boolean);
    for (const segment of segments) {
      const trimmed = segment.trim();
      // Skip segments that look like titles/headers
      if (trimmed.length > 15 && !/^[A-Z\s]{5,30}$/.test(trimmed)) {
        highlights.push(trimmed);
      }
    }
    
    if (highlights.length > 0) {
      return highlights;
    }
  }
  
  // If nothing else worked, split by paragraph and try to identify complete sentences
  if (highlights.length === 0) {
    detectedFormat = "General Text Format";
    
    // First try to split by common sentence endings
    const sentencePattern = /(?<=[.!?])\s+(?=[A-Z])/g;
    let sentences = text.substring(contentStartIndex).split(sentencePattern).filter(Boolean);
    
    // Improved sentence extraction - ensure we have complete sentences
    // If we have incomplete sentences that start midway, try to combine them into meaningful units
    if (sentences.length > 0) {
      const improvedSentences: string[] = [];
      let currentSentence = '';
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        // Skip very short sentences or obvious headers
        if (trimmed.length < 15 || /^[A-Z\s]{5,30}$/.test(trimmed)) {
          continue;
        }
        
        // Check if this sentence starts with lowercase (indicating incomplete sentence) 
        // and there's no punctuation at the end of our current accumulator
        if (/^[a-z]/.test(trimmed) && !currentSentence.match(/[.!?]$/)) {
          currentSentence += ' ' + trimmed;
        } else {
          // If we have accumulated content, add it first
          if (currentSentence) {
            improvedSentences.push(currentSentence.trim());
            currentSentence = '';
          }
          currentSentence = trimmed;
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
      if (chunk.trim().length > 20) {
        highlights.push(chunk.trim());
      }
    }
  }
  
  return highlights;
};

// Function to detect the format of the PDF
export const detectPDFFormat = (text: string): string | null => {
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
  
  // Structured document with numbered sections and bullet points
  if (text.match(/^\d+\.\s+.+?\n/m) || text.match(/^\s*•\s+.+?\n/m)) {
    return "Structured Document with Bullet Points";
  }
  
  // Check for bullet points with dash or asterisk
  if (text.match(/(?:\n|\r\n?)\s*(?:•|\*|-|\d+\.)\s+/)) {
    return "Bullet Point Format";
  }
  
  return "General Text Format";
};
