
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { HighlightCandidate } from '@/utils/pdfExtractor';

interface HighlightsReviewProps {
  highlights: HighlightCandidate[];
  toggleHighlight: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  isUploading: boolean;
  formatType?: string | null;
}

const HighlightsReview: React.FC<HighlightsReviewProps> = ({
  highlights,
  toggleHighlight,
  onSave,
  onCancel,
  isUploading,
  formatType,
}) => {
  const formatHighlightText = (text: string) => {
    // Check if this is a structured highlight with bullet points or numbering
    const hasStructure = text.includes('\n') && (
      text.match(/\d+\.\s/) || 
      text.match(/[a-z]\.\s/) || 
      text.match(/[ivxlcdm]+\.\s/) || 
      text.includes('•') || 
      text.includes('\n-') ||
      text.match(/\n\s*\d+\./)
    );
    
    if (hasStructure) {
      // For structured content, we want to preserve the formatting
      return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }
    
    // For regular text, truncate if it's too long
    return text.length > 150 ? `${text.substring(0, 150)}...` : text;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Found {highlights.length} highlights</h3>
        <p className="text-sm text-muted-foreground">
          We identified the following highlights from your PDF. Uncheck any items you don't want to save.
          {formatType && <span className="block mt-1 font-medium">Format: {formatType}</span>}
        </p>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-md p-4">
        {highlights.map((item, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-md text-sm flex gap-2 ${item.selected ? 'bg-primary/10' : 'bg-muted/30'}`}
          >
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => toggleHighlight(index)}
              className="mt-1 shrink-0"
            />
            <div className="whitespace-pre-line">
              {formatHighlightText(item.text)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Saving...' : `Save ${highlights.filter(item => item.selected).length} Highlights`}
        </Button>
        
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default HighlightsReview;
