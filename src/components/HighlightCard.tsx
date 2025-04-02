
import React from 'react';
import { Highlight } from '@/types/highlight';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, Heart, Edit } from 'lucide-react';
import { toggleFavorite, deleteHighlight } from '@/utils/highlights';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface HighlightCardProps {
  highlight: Highlight;
  onDelete: (id: string) => void;
  onEdit?: (highlight: Highlight) => void;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ 
  highlight, 
  onDelete,
  onEdit
}) => {
  const { toast } = useToast();
  
  const handleToggleFavorite = () => {
    toggleFavorite(highlight.id);
    toast({
      title: highlight.favorite ? "Removed from favorites" : "Added to favorites",
      duration: 2000,
    });
    // Force refresh by calling onDelete with same list
    onDelete("");
  };
  
  const handleDelete = () => {
    deleteHighlight(highlight.id);
    toast({
      title: "Highlight deleted",
      duration: 2000,
    });
    onDelete(highlight.id);
  };

  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="text-xs text-muted-foreground flex flex-col">
          <span className="font-semibold text-secondary">{highlight.category}</span>
          <span>Added on {format(highlight.dateAdded, 'MMM d, yyyy')}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-8 w-8 ${highlight.favorite ? 'text-red-500' : 'text-muted-foreground'}`}
          onClick={handleToggleFavorite}
        >
          <Heart className={`h-4 w-4 ${highlight.favorite ? 'fill-red-500' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <blockquote className="quote-text border-l-2 border-primary/50 pl-3 italic text-base">
          {highlight.text}
        </blockquote>
        <div className="mt-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{highlight.author}</span>
            {highlight.source && (
              <>, <span className="italic">{highlight.source}</span></>
            )}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => onEdit(highlight)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={handleDelete}
        >
          <Trash className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HighlightCard;
