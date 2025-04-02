
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle } from 'lucide-react';
import { addHighlight, updateHighlight } from '@/utils/highlights';
import { Highlight } from '@/types/highlight';

interface AddHighlightFormProps {
  existingHighlight?: Highlight;
  onSuccess?: () => void;
}

const AddHighlightForm: React.FC<AddHighlightFormProps> = ({ 
  existingHighlight,
  onSuccess
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Highlight, 'id' | 'dateAdded'>>({
    text: existingHighlight?.text || '',
    source: existingHighlight?.source || '',
    author: existingHighlight?.author || '',
    category: existingHighlight?.category || '',
    favorite: existingHighlight?.favorite || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text) {
      toast({
        title: "Please enter a highlight text",
        variant: "destructive",
      });
      return;
    }
    
    if (existingHighlight) {
      updateHighlight({
        ...existingHighlight,
        ...formData
      });
      toast({
        title: "Highlight updated",
        description: "Your highlight has been successfully updated.",
      });
    } else {
      addHighlight(formData);
      toast({
        title: "Highlight added",
        description: "Your highlight has been successfully saved.",
      });
    }
    
    setOpen(false);
    setFormData({
      text: '',
      source: '',
      author: '',
      category: '',
      favorite: false,
    });
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size={existingHighlight ? "sm" : "default"}>
          <PlusCircle className="h-4 w-4" />
          {existingHighlight ? 'Edit' : 'Add Highlight'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{existingHighlight ? 'Edit Highlight' : 'Add New Highlight'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text">Highlight Text</Label>
            <Textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Enter your highlight or quote here..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Author name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="Book, article, etc."
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Philosophy, Business, Fiction"
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{existingHighlight ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHighlightForm;
