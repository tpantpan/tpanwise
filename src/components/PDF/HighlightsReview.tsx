
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { HighlightCandidate } from '@/utils/pdfExtractor';
import { Separator } from '@/components/ui/separator';

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
      text.match(/\n\s*\d+\./) ||
      text.match(/benefits\s+of\s+\w+/i)
    );
    
    if (hasStructure) {
      // For structured content, we want to preserve the formatting
      // Special handling for hierarchical content to show proper indentation
      return text.split('\n').map((line, i) => {
        // Add appropriate indentation for sub-items
        const isSubItem = line.trim().match(/^\s*[a-z]\.\s/);
        const isSubSubItem = line.trim().match(/^\s*[ivxlcdm]+\.\s/) || line.trim().match(/^\s*\d+\.\d+\.\s/);
        const isNumbered = line.trim().match(/^\s*\d+\.\s/);
        const isBullet = line.trim().match(/^\s*[•\-*]\s/);
        
        let className = '';
        if (isSubItem) {
          className = 'pl-4'; // First level indent
        } else if (isSubSubItem) {
          className = 'pl-8'; // Second level indent
        } else if (isNumbered || isBullet) {
          className = ''; // No extra indent for top-level numbered/bulleted items
        }
        
        return (
          <div key={i} className={className}>
            {line}
          </div>
        );
      });
    }
    
    // For regular text, truncate if it's too long for display
    if (text.length > 300) {
      return (
        <div>
          {text.substring(0, 300)}
          <span className="text-muted-foreground">...</span>
          <span className="text-xs text-muted-foreground ml-1">
            ({text.length} characters)
          </span>
        </div>
      );
    }
    
    return text;
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
              {index < highlights.length - 1 && (
                <div className="pt-2 opacity-50">
                  <Separator className="mt-1" />
                </div>
              )}
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
