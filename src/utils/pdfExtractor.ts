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
  
  // Remove excessive whitespace while preserving paragraph breaks
  const cleanText = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  
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

  // NEW: Check for horizontal line separators (e.g., "______" or "------" or "=====" or "-----")
  // This is a strong indicator of highlights separation in the document
  const horizontalLinePattern = /\n\s*[-_=]{3,}\s*\n/g;
  if (text.match(horizontalLinePattern)) {
    console.log("Detected horizontal line separators between highlights");
    detectedFormat = "Horizontal Line Separated Format";
    
    // Split the content by horizontal lines
    const segments = text.split(horizontalLinePattern).map(s => s.trim()).filter(Boolean);
    
    // Skip the first segment if it looks like metadata/title
    const startIndex = (segments[0].length < 100 && segments[0].split('\n').length <= 3) ? 1 : 0;
    
    // Add each segment as a highlight
    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i].trim();
      // Skip very short segments that might be just page numbers or headers
      if (segment.length > 20) {
        highlights.push(segment);
      }
    }
    
    if (highlights.length > 0) {
      console.log(`Found ${highlights.length} highlights using horizontal line separators`);
      return highlights;
    }
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

  // Pattern 4: Look for explicit numbered sections that should be treated as complete highlights
  // This could be like "6 benefits of Bizlove" and its bullet points
  const numberedSectionPattern = /(\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+)/i;
  if (text.match(numberedSectionPattern)) {
    // Instead of treating the entire section as one highlight,
    // we'll treat it as individual highlights based on other separators
    console.log("Detected 'benefits' section but will process using other patterns");
  }

  // Pattern 5: Simple paragraphs separated by blank lines
  const paraPattern = /\n\s*\n/g; 
  const paragraphs = text.split(paraPattern).map(p => p.trim()).filter(Boolean);
  
  if (paragraphs.length > 1) {
    detectedFormat = "Paragraph Format";
    let currentParagraph = "";
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      
      // Skip very short paragraphs that might just be headers
      if (para.length < 15 || isMetadataOrTitle(para)) {
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
  
  // If nothing else worked, split by paragraph and try to identify complete sentences
  if (highlights.length === 0) {
    detectedFormat = "General Text Format";
    
    // First try to split by common sentence endings
    const sentencePattern = /(?<=[.!?])\s+(?=[A-Z])/g;
    let sentences = text.substring(contentStartIndex).split(sentencePattern).filter(Boolean);
    
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

// Helper function to detect if text is metadata or title
const isMetadataOrTitle = (text: string): boolean => {
  // Check if text is short and looks like a title/header
  if (text.length < 40 && /^[A-Z][\w\s]+$/.test(text)) {
    return true;
  }
  
  // Check if text contains typical metadata like "Page X" or "Chapter Y"
  if (text.match(/^(?:Page|Chapter|Section|Part)\s+\d+/i)) {
    return true;
  }
  
  // Check if text is a header like "Introduction" or "Conclusion"
  if (text.match(/^(?:Introduction|Conclusion|Preface|Foreword|Acknowledgements|References|Bibliography|Index|Glossary|Appendix)$/i)) {
    return true;
  }
  
  return false;
};

// Function to detect the format of the PDF
export const detectPDFFormat = (text: string): string | null => {
  // Check for horizontal line separators
  if (text.match(/\n\s*[-_=]{3,}\s*\n/g)) {
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
