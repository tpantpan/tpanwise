
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface UploadFormProps {
  onSubmit: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
  author: string;
  setAuthor: (author: string) => void;
  source: string;
  setSource: (source: string) => void;
  category: string;
  setCategory: (category: string) => void;
  isUploading: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({
  onSubmit,
  file,
  setFile,
  author,
  setAuthor,
  source,
  setSource,
  category,
  setCategory,
  isUploading,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="pdf-file">PDF File</Label>
        <Input 
          id="pdf-file" 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange}
          className="cursor-pointer"
        />
      </div>
      
      <div className="space-y-2">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
          />
        </div>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Book title, article, etc."
          />
        </div>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
          />
        </div>
      </div>
      
      <Button 
        onClick={onSubmit}
        disabled={isUploading || !file}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        {isUploading ? 'Processing...' : 'Extract Highlights'}
      </Button>
    </div>
  );
};

export default UploadForm;
