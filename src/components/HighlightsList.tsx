
import React, { useState, useEffect } from 'react';
import HighlightCard from './HighlightCard';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Highlight } from '@/types/highlight';
import { loadHighlights, deleteHighlightsBySource, getAllSources } from '@/utils/highlights';
import { Search, Filter, ListFilter, Trash2 } from 'lucide-react';
import AddHighlightForm from './AddHighlightForm';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const HighlightsList: React.FC = () => {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load highlights on component mount
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const highlightsData = await loadHighlights();
        setHighlights(highlightsData);
        
        // Get all unique sources
        const sourcesData = await getAllSources();
        setSources(sourcesData);
      } catch (error) {
        console.error('Error loading highlights:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHighlights();
  }, []);
  
  // Get unique categories
  const categories = ['all', ...new Set(highlights.map(h => h.category))].filter(Boolean);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  
  // Handle refresh after delete
  const handleDeleteRefresh = async () => {
    try {
      const refreshedHighlights = await loadHighlights();
      setHighlights(refreshedHighlights);
      
      // Refresh sources list
      const sourcesData = await getAllSources();
      setSources(sourcesData);
    } catch (error) {
      console.error('Error refreshing highlights:', error);
    }
  };
  
  // Filter and sort highlights
  const filteredHighlights = highlights
    .filter(highlight => {
      const matchesSearch = 
        highlight.text.toLowerCase().includes(search.toLowerCase()) ||
        highlight.author?.toLowerCase().includes(search.toLowerCase()) ||
        highlight.source?.toLowerCase().includes(search.toLowerCase());
        
      const matchesCategory = 
        categoryFilter === 'all' || 
        highlight.category === categoryFilter;
        
      const matchesSource = 
        sourceFilter === 'all' || 
        highlight.source === sourceFilter;
        
      return matchesSearch && matchesCategory && matchesSource;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'oldest':
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'favorites':
          return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        default:
          return 0;
      }
    });
    
  const handleEditComplete = async () => {
    try {
      const refreshedHighlights = await loadHighlights();
      setHighlights(refreshedHighlights);
      setEditingHighlight(null);
    } catch (error) {
      console.error('Error refreshing highlights after edit:', error);
    }
  };

  const handleDeleteBySource = async (source: string) => {
    if (!source || source === 'all') return;
    
    setIsDeleting(true);
    try {
      const success = await deleteHighlightsBySource(source);
      
      if (success) {
        toast({
          title: "Highlights deleted",
          description: `All highlights from "${source}" have been deleted.`
        });
        
        // Reset the source filter
        setSourceFilter('all');
        
        // Refresh the highlights list
        await handleDeleteRefresh();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete highlights",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting highlights by source:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading highlights...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">All Highlights</h2>
          <Badge variant="secondary" className="ml-2">
            {highlights.length} total
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search highlights..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-40">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-40">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Source" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-36">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {sourceFilter !== 'all' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="icon"
                  className="w-full h-10 sm:w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all highlights from "{sourceFilter}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all highlights 
                    from this source from your collection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteBySource(sourceFilter)}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      {filteredHighlights.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No highlights found</p>
          <AddHighlightForm onSuccess={handleDeleteRefresh} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHighlights.map(highlight => (
            <HighlightCard 
              key={highlight.id} 
              highlight={highlight} 
              onDelete={handleDeleteRefresh}
              onEdit={setEditingHighlight}
            />
          ))}
        </div>
      )}
      
      {editingHighlight && (
        <div className="hidden">
          <AddHighlightForm 
            existingHighlight={editingHighlight} 
            onSuccess={handleEditComplete}
          />
        </div>
      )}
    </div>
  );
};

export default HighlightsList;
