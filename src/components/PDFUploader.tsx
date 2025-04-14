
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { addHighlight } from '@/utils/highlights';
import { extractTextFromPDF, extractHighlights, detectPDFFormat, HighlightCandidate } from '@/utils/pdfExtractor';
import UploadForm from './PDF/UploadForm';
import HighlightsReview from './PDF/HighlightsReview';

interface PDFUploaderProps {
  onSuccess?: () => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Book');
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<HighlightCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const { toast } = useToast();

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
      setDetectedFormat(null);

      // Extract text from PDF
      const fullText = await extractTextFromPDF(file);
      
      if (fullText.trim().length === 0) {
        setError('No text found in the PDF or the PDF might be scanned images');
        setIsUploading(false);
        return;
      }
      
      // Detect the format of the PDF
      const format = detectPDFFormat(fullText);
      if (format) {
        setDetectedFormat(format);
        console.log(`Detected PDF format: ${format}`);
      }
      
      // Extract individual highlights
      const highlights = extractHighlights(fullText);
      
      if (highlights.length === 0) {
        setError('Could not identify individual highlights in the PDF');
        setIsUploading(false);
        return;
      }
      
      toast({
        title: 'Highlights detected',
        description: `Found ${highlights.length} potential highlights in your document`,
      });
      
      setExtractedText(highlights.map(text => ({ text, selected: true })));
      setIsUploading(false);
      
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to parse the PDF. The file might be corrupted or password-protected.');
      setIsUploading(false);
    }
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
      setDetectedFormat(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving highlights:', err);
      setError('Failed to save highlights');
      setIsUploading(false);
    }
  };

  // Reset the highlights view
  const cancelHighlightsReview = () => {
    setExtractedText([]);
    setDetectedFormat(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {detectedFormat && (
        <Alert>
          <AlertDescription>
            Detected format: <strong>{detectedFormat}</strong>
          </AlertDescription>
        </Alert>
      )}

      {extractedText.length === 0 ? (
        // Step 1: PDF Upload Form
        <UploadForm
          onSubmit={parsePDF}
          file={file}
          setFile={setFile}
          author={author}
          setAuthor={setAuthor}
          source={source}
          setSource={setSource}
          category={category}
          setCategory={setCategory}
          isUploading={isUploading}
        />
      ) : (
        // Step 2: Review highlights
        <HighlightsReview
          highlights={extractedText}
          toggleHighlight={toggleHighlightSelection}
          onSave={saveHighlights}
          onCancel={cancelHighlightsReview}
          isUploading={isUploading}
          formatType={detectedFormat}
        />
      )}
    </div>
  );
};

export default PDFUploader;
