
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Settings, Bookmark } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl">Sparkler</span>
        </Link>
        
        <nav className="flex gap-4">
          <Link 
            to="/" 
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Home</span>
          </Link>
          
          <Link 
            to="/highlights" 
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/highlights' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>My Highlights</span>
          </Link>
          
          <Link 
            to="/settings" 
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
