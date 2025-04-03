
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

const PDFUploader: React.FC<PDFUploaderProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Book');
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string[]>([]);
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
      
      const highlights: string[] = [];
      
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => item.str);
        
        // Join all text from the page
        const text = textItems.join(' ');
        
        // Split text into paragraphs or sections (simple approach)
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 15);
        
        // Add to highlights
        highlights.push(...paragraphs);
      }
      
      if (highlights.length === 0) {
        setError('No text found in the PDF or the PDF might be scanned images');
        setIsUploading(false);
        return;
      }
      
      setExtractedText(highlights);
      setIsUploading(false);
      
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to parse the PDF. The file might be corrupted or password-protected.');
      setIsUploading(false);
    }
  };

  // Save highlights to storage
  const saveHighlights = async () => {
    if (extractedText.length === 0) {
      setError('No highlights to save');
      return;
    }

    setIsUploading(true);
    try {
      // Add each extracted text as a highlight
      for (const text of extractedText) {
        if (text.trim().length > 10) { // Ensure it's not too short
          await addHighlight({
            text,
            author,
            source,
            category,
            favorite: false
          });
        }
      }

      toast({
        title: 'Success!',
        description: `${extractedText.length} highlights added from your PDF`,
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
              We extracted the following highlights from your PDF. Click "Save All" to add them to your collection.
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-4">
            {extractedText.map((text, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-md text-sm">
                {text.length > 150 ? `${text.substring(0, 150)}...` : text}
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
              {isUploading ? 'Saving...' : 'Save All Highlights'}
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
