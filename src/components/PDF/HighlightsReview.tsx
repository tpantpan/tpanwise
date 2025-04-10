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
    const hasBullets = text.includes('•') || text.includes('\n-') || /\n\s*\d+\./.test(text);
    
    if (hasBullets) {
      const maxLength = 300;
      const displayText = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
      
      return displayText.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < displayText.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }
    
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
      
      <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-4">
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
            <span className="whitespace-pre-line">
              {formatHighlightText(item.text)}
            </span>
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
