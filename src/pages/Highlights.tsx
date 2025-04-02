
import React from 'react';
import Header from '@/components/Header';
import AddHighlightForm from '@/components/AddHighlightForm';
import HighlightsList from '@/components/HighlightsList';

const Highlights: React.FC = () => {
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleHighlightAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">My Highlights</h1>
            <AddHighlightForm onSuccess={handleHighlightAdded} />
          </div>
          
          <HighlightsList key={refreshKey} />
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

export default Highlights;
