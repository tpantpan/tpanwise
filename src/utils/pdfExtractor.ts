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

  // Pattern 0: Check for section headers like "6 benefits of Bizlove"
  const sectionHeaderPattern = /(\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+)/gi;
  const sectionHeaderMatches = [...text.matchAll(sectionHeaderPattern)];
  
  if (sectionHeaderMatches.length > 0) {
    console.log(`Detected section headers: ${sectionHeaderMatches.map(m => m[0]).join(', ')}`);
    detectedFormat = "Structured Document with Section Headers";
    
    // Extract paragraphs that end before section headers
    let lastIndex = 0;
    let paragraphs: string[] = [];
    
    for (const match of sectionHeaderMatches) {
      if (match.index) {
        const precedingText = text.substring(lastIndex, match.index).trim();
        if (precedingText.length > 50) {  // Only include substantive paragraphs
          paragraphs.push(precedingText);
        }
        lastIndex = match.index;
      }
    }
    
    // Add final paragraph after the last section header
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim();
      
      // Check if the remaining text is a structured section (like "6 benefits of Bizlove")
      if (remainingText.match(/^\d+\s+benefits\s+of\s+\w+/i)) {
        // This is a structured section with numbered items
        // We want to keep this entire section as one highlight
        paragraphs.push(remainingText);
      } else {
        // Process the remaining text using other patterns
        const structuredPoints = extractStructuredPoints(remainingText);
        paragraphs = [...paragraphs, ...structuredPoints];
      }
    }
    
    // Add the extracted paragraphs as highlights
    highlights.push(...paragraphs.filter(p => p.trim().length > 20));
    
    if (highlights.length > 0) {
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
  // Like "6 benefits of Bizlove" followed by numbered items
  const numberedSectionPattern = /(\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+)[\s\S]*?(?=\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+|$)/gi;
  const sections = [...text.matchAll(numberedSectionPattern)];
  
  if (sections.length > 0) {
    detectedFormat = "Numbered Benefits Section";
    
    for (const section of sections) {
      const sectionText = section[0].trim();
      if (sectionText.length > 30) {
        highlights.push(sectionText);
      }
    }
    
    if (highlights.length > 0) {
      return highlights;
    }
  }

  // Pattern 5: Check for paragraphs that end with a period followed by a number at the start of the next line
  // This indicates the start of a new point in a structured document
  const paragraphWithNumberPattern = /([\s\S]+?)(?:\.\s*\n\s*\d+\.|\.\s*$)/g;
  const paragraphs = [...text.matchAll(paragraphWithNumberPattern)];
  
  if (paragraphs.length > 0) {
    detectedFormat = "Paragraphs with Numbered Points";
    
    for (const paragraph of paragraphs) {
      const paragraphText = paragraph[1].trim();
      if (paragraphText.length > 30 && !paragraphText.match(/^[0-9.]+$/)) {
        highlights.push(paragraphText);
      }
    }
    
    if (highlights.length > 0) {
      return highlights;
    }
  }

  // Pattern 6: Handle hierarchical structure with main section and sub-points
  // This is the pattern we need to improve to handle the Bizlove-style content
  const structuredContent = extractStructuredSections(text);
  if (structuredContent.length > 0) {
    detectedFormat = "Hierarchical Structured Document";
    highlights.push(...structuredContent);
    
    if (highlights.length > 0) {
      return highlights;
    }
  }

  // Pattern 7: Simple paragraphs separated by blank lines
  const simpleParas = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (simpleParas.length > 0) {
    detectedFormat = "Paragraph Format";
    
    for (const para of simpleParas) {
      if (para.length > 30 && !isMetadataOrTitle(para)) {
        highlights.push(para.trim());
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

// Helper function to extract hierarchical structured sections
const extractStructuredSections = (text: string): string[] => {
  const sections: string[] = [];
  
  // Look for main sections with headers like "6 benefits of Bizlove"
  const mainSectionPattern = /(\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+)([\s\S]*?)(?=(?:\d+\s+benefits\s+of\s+\w+|\w+\s+benefits\s+of\s+\w+)|$)/gi;
  const mainSections = [...text.matchAll(mainSectionPattern)];
  
  if (mainSections.length > 0) {
    for (const section of mainSections) {
      const sectionHeader = section[1].trim();
      const sectionContent = section[2].trim();
      
      // Add the complete section (header + content) as one highlight
      const completeSection = `${sectionHeader}\n${sectionContent}`.trim();
      sections.push(completeSection);
    }
  } else {
    // If no clear section headers, try to extract standalone paragraphs
    // that appear to be complete thoughts and not part of a list
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      
      // Skip if it looks like a header or metadata
      if (isMetadataOrTitle(trimmed) || trimmed.length < 50) {
        continue;
      }
      
      // If the paragraph doesn't start with a bullet or number, it's likely a standalone highlight
      if (!trimmed.match(/^\s*(\d+\.|[a-z]\.|•|\*|-)\s/)) {
        sections.push(trimmed);
      }
    }
  }
  
  // Try another approach for numbered points that belong together
  const numberedOutlinePattern = /(\d+)\.\s+(.*?)(?=\n\s*\d+\.\s+|$)/gs;
  const numberedMatches = [...text.matchAll(numberedOutlinePattern)];
  
  // Check if we have consecutive numbered points (1, 2, 3...)
  if (numberedMatches.length > 1) {
    const numbers = numberedMatches.map(m => parseInt(m[1]));
    const isSequential = numbers.every((num, idx) => 
      idx === 0 || num === numbers[idx-1] + 1 || num === 1);
    
    if (isSequential) {
      // Find where the whole numbered section starts and ends
      const startPos = numberedMatches[0].index;
      const lastMatch = numberedMatches[numberedMatches.length - 1];
      const endPos = lastMatch ? (lastMatch.index || 0) + lastMatch[0].length : text.length;
      
      if (startPos !== undefined && startPos > 0) {
        // Look for a potential header before the numbered section
        const headerSearchText = text.substring(Math.max(0, startPos - 200), startPos).trim();
        const headerMatch = headerSearchText.match(/([^\n.]+)$/);
        
        if (headerMatch) {
          const header = headerMatch[1].trim();
          const numberedSection = text.substring(startPos, endPos).trim();
          sections.push(`${header}\n${numberedSection}`);
        } else {
          sections.push(text.substring(startPos, endPos).trim());
        }
      }
    }
  }
  
  return sections;
};

// Helper function to extract structured bullet points or numbered lists
const extractStructuredPoints = (text: string): string[] => {
  const points: string[] = [];
  
  // Check for numbered list (1., 2., etc.)
  const numberedListMatch = text.match(/(\d+\.\s+.*?(?=\n\s*\d+\.\s+|\n\s*$|$))+/gs);
  
  if (numberedListMatch) {
    // Found a numbered list, keep each group as a single highlight
    for (const listSection of numberedListMatch) {
      if (listSection.trim().length > 30) {
        // Check if this numbered list has a header above it
        const possibleHeaderMatch = text.match(new RegExp(`([^\n.]+)\n${escapeRegExp(listSection.substring(0, 20))}`));
        
        if (possibleHeaderMatch) {
          points.push(`${possibleHeaderMatch[1].trim()}\n${listSection.trim()}`);
        } else {
          points.push(listSection.trim());
        }
      }
    }
  }
  
  // Check for hierarchical structure (1. a. b. c. 2. a. b...)
  const hierarchicalMatch = text.match(/(\d+\.\s+.*?(?=\n\s*\d+\.\s+|\n\s*$|$))/gs);
  
  if (hierarchicalMatch) {
    // Process each top-level item
    for (let i = 0; i < hierarchicalMatch.length; i++) {
      const currentItem = hierarchicalMatch[i].trim();
      
      // Get the number of this item (e.g., "1." from "1. Some text")
      const currentNumberMatch = currentItem.match(/^(\d+)\./);
      if (!currentNumberMatch) continue;
      
      const currentNumber = parseInt(currentNumberMatch[1]);
      let fullSection = currentItem;
      
      // Look ahead to see if there are lettered sub-items (a., b., etc.)
      // that should be included with this numbered item
      const letterItemPattern = new RegExp(`\\n\\s*[a-z]\\.\s+.*?(?=\\n\\s*\\d+\\.\\s+|\\n\\s*[a-z]\\.\\s+|$)`, 'gs');
      const letterMatches = [...text.matchAll(letterItemPattern)];
      
      if (letterMatches.length > 0) {
        // Find the next numbered item
        const nextNumberedItemIndex = i + 1 < hierarchicalMatch.length ? 
          text.indexOf(hierarchicalMatch[i + 1]) : text.length;
        
        // Include all letter items until the next numbered item
        for (const letterMatch of letterMatches) {
          const letterMatchIndex = letterMatch.index || 0;
          
          // Check if this lettered item belongs to the current numbered item
          // (i.e., it appears after the current numbered item but before the next one)
          if (letterMatchIndex > text.indexOf(currentItem) && 
              letterMatchIndex < nextNumberedItemIndex) {
            fullSection += letterMatch[0];
          }
        }
      }
      
      if (fullSection.trim().length > 30) {
        points.push(fullSection.trim());
      }
    }
  }
  
  // Check for bullet point lists (•, *, -)
  const bulletPattern = /(?:^|\n)(\s*(?:•|\*|-)\s+.*?(?=\n\s*(?:•|\*|-)\s+|\n\s*$|$))+/gs;
  const bulletMatches = text.match(bulletPattern);
  
  if (bulletMatches) {
    for (const bulletSection of bulletMatches) {
      if (bulletSection.trim().length > 30) {
        points.push(bulletSection.trim());
      }
    }
  }
  
  return points;
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

// Escape special regex characters in a string
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Function to detect the format of the PDF
export const detectPDFFormat = (text: string): string | null => {
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
