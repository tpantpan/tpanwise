
import React from 'react';
import Header from '@/components/Header';
import EmailSettings from '@/components/EmailSettings';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Settings</h1>
          
          <div className="max-w-xl mx-auto">
            <EmailSettings />
            
            <div className="mt-12 p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">About Sparkler</h2>
              <p className="text-muted-foreground mb-4">
                Sparkler is your personal highlight library, designed to help you remember and revisit your favorite quotes and ideas.
              </p>
              <p className="text-sm text-muted-foreground">
                All your highlights are stored locally in your browser. 
                For the best experience, use the same device and browser to access your collection.
              </p>
            </div>
          </div>
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

export default Settings;
