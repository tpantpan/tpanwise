
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import RandomHighlight from '@/components/RandomHighlight';
import AddHighlightForm from '@/components/AddHighlightForm';
import { loadHighlights } from '@/utils/highlights';

const Index: React.FC = () => {
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const highlights = await loadHighlights();
        setHighlightsCount(highlights.length);
      } catch (error) {
        console.error('Error loading highlights count:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHighlights();
  }, []);

  const handleHighlightAdded = async () => {
    try {
      const highlights = await loadHighlights();
      setHighlightsCount(highlights.length);
    } catch (error) {
      console.error('Error updating highlights count:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <section className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to Sparkler</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your personal library of highlights, quotes, and snippets from your favorite books, articles, and videos.
            </p>
          </section>
          
          <section className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Today's Highlight</h2>
              <AddHighlightForm 
                onSuccess={handleHighlightAdded} 
              />
            </div>
            <RandomHighlight />
          </section>
          
          <section className="max-w-lg mx-auto text-center">
            <div className="p-6 border rounded-lg bg-accent/20">
              <h3 className="text-xl font-medium mb-2">Your Collection</h3>
              <p className="text-muted-foreground mb-4">
                {isLoading ? 'Loading...' : (
                  highlightsCount === 0 ? 
                  "You don't have any highlights yet. Start building your collection!" :
                  `You have ${highlightsCount} highlight${highlightsCount === 1 ? '' : 's'} in your collection.`
                )}
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild variant="outline">
                  <Link to="/highlights" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Manage Highlights
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/settings">
                    Configure Email Delivery
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sparkler — Your Personal Highlights Library</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
