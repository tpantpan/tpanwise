
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addHighlight } from '@/utils/highlights';
import { Image } from 'lucide-react';

interface ImageUploaderProps {
  onSuccess?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Book');
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's an image
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Save the image as a highlight
  const handleSave = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (!author) {
      toast({
        title: "Error",
        description: "Please enter an author name",
        variant: "destructive"
      });
      return;
    }

    if (!source) {
      toast({
        title: "Error",
        description: "Please enter a source",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert image to base64 for storage
      const base64Data = await toBase64(file);
      
      // Create highlight with image data
      await addHighlight({
        text: `[Image] ${file.name}`,
        author,
        source,
        category,
        favorite: false,
        imageData: base64Data
      });

      toast({
        title: "Success!",
        description: "Image highlight saved successfully",
      });

      // Reset form
      setFile(null);
      setImagePreview(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving image highlight:", error);
      toast({
        title: "Error",
        description: "Failed to save image highlight",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to convert File to base64
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="image-file">Image File</Label>
        <Input 
          id="image-file" 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="cursor-pointer"
        />
      </div>
      
      {imagePreview && (
        <div className="border rounded-md p-2 max-w-xs">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-h-48 mx-auto"
          />
        </div>
      )}
      
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
        onClick={handleSave}
        disabled={isUploading || !file}
        className="flex items-center gap-2"
      >
        <Image className="h-4 w-4" />
        {isUploading ? 'Saving...' : 'Save Image Highlight'}
      </Button>
    </div>
  );
};

export default ImageUploader;
