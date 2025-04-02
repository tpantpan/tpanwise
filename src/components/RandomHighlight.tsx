
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRandomHighlight } from '@/utils/highlights';
import { Highlight } from '@/types/highlight';
import { RefreshCw } from 'lucide-react';

const RandomHighlight: React.FC = () => {
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRandomHighlight();
  }, []);

  const loadRandomHighlight = async () => {
    setIsLoading(true);
    try {
      // Simulate a slight delay for animation
      await new Promise(resolve => setTimeout(resolve, 400));
      const randomHighlight = await getRandomHighlight();
      setHighlight(randomHighlight);
    } catch (error) {
      console.error('Error loading random highlight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <CardContent>
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!highlight) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">No highlights found. Add some to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full relative overflow-hidden transition-all duration-500">
      <div className={`absolute inset-0 bg-accent/50 flex items-center justify-center transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
      
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary font-medium">
              {highlight.category}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 gap-1" 
              onClick={loadRandomHighlight}
            >
              <RefreshCw className="h-3 w-3" />
              <span className="text-xs">New</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 pb-4">
          <blockquote className="quote-text text-lg md:text-xl font-medium text-foreground relative">
            <span className="absolute -top-4 -left-1 text-4xl text-primary/20">"</span>
            {highlight.text}
            <span className="absolute -bottom-4 -right-1 text-4xl text-primary/20">"</span>
          </blockquote>
        </CardContent>
        
        <CardFooter className="pt-2 flex justify-end">
          <div className="text-sm">
            <p className="text-foreground font-medium">
              {highlight.author}
            </p>
            {highlight.source && (
              <p className="text-muted-foreground italic">
                {highlight.source}
              </p>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  );
};

export default RandomHighlight;
