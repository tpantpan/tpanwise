
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import { addHighlight } from '@/utils/highlights';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFUploaderProps {
  onSuccess?: () => void;
}

interface HighlightCandidate {
  text: string;
  selected: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Book');
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<HighlightCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Parse PDF and extract text
  const parsePDF = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    if (!author) {
      setError('Please enter the author name');
      return;
    }

    if (!source) {
      setError('Please enter the source');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

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
      
      if (fullText.trim().length === 0) {
        setError('No text found in the PDF or the PDF might be scanned images');
        setIsUploading(false);
        return;
      }
      
      // Extract individual highlights using various patterns
      const highlights = extractHighlights(fullText);
      
      if (highlights.length === 0) {
        setError('Could not identify individual highlights in the PDF');
        setIsUploading(false);
        return;
      }
      
      setExtractedText(highlights.map(text => ({ text, selected: true })));
      setIsUploading(false);
      
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to parse the PDF. The file might be corrupted or password-protected.');
      setIsUploading(false);
    }
  };

  // Function to extract individual highlights from text
  const extractHighlights = (text: string): string[] => {
    const highlights: string[] = [];
    
    // Try different patterns to split the text into highlights
    
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

  // Toggle selection of a highlight
  const toggleHighlightSelection = (index: number) => {
    setExtractedText(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Save highlights to storage
  const saveHighlights = async () => {
    const selectedHighlights = extractedText.filter(item => item.selected);
    
    if (selectedHighlights.length === 0) {
      setError('No highlights selected to save');
      return;
    }

    setIsUploading(true);
    try {
      // Add each extracted text as a highlight
      for (const { text } of selectedHighlights) {
        await addHighlight({
          text,
          author,
          source,
          category,
          favorite: false
        });
      }

      toast({
        title: 'Success!',
        description: `${selectedHighlights.length} highlights added from your PDF`,
      });

      // Reset state
      setFile(null);
      setExtractedText([]);
      setIsUploading(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving highlights:', err);
      setError('Failed to save highlights');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {extractedText.length === 0 ? (
        // Step 1: PDF Upload
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="pdf-file">PDF File</Label>
            <Input 
              id="pdf-file" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
              />
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Book title, article, etc."
              />
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
              />
            </div>
          </div>
          
          <Button 
            onClick={parsePDF}
            disabled={isUploading || !file}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isUploading ? 'Processing...' : 'Extract Highlights'}
          </Button>
        </div>
      ) : (
        // Step 2: Review highlights
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Found {extractedText.length} highlights</h3>
            <p className="text-sm text-muted-foreground">
              We identified the following highlights from your PDF. Uncheck any items you don't want to save.
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-4">
            {extractedText.map((item, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-md text-sm flex gap-2 ${item.selected ? 'bg-primary/10' : 'bg-muted/30'}`}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleHighlightSelection(index)}
                  className="mt-1 shrink-0"
                />
                <span>
                  {item.text.length > 150 ? `${item.text.substring(0, 150)}...` : item.text}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={saveHighlights}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Saving...' : `Save ${extractedText.filter(item => item.selected).length} Highlights`}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setExtractedText([])}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
