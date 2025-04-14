
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface ImageUploaderDialogProps {
  onSuccess?: () => void;
}

const ImageUploaderDialog: React.FC<ImageUploaderDialogProps> = ({ onSuccess }) => {
  const [open, setOpen] = React.useState(false);
  
  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Upload Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>
            Upload an image as a highlight.
          </DialogDescription>
        </DialogHeader>
        <ImageUploader onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploaderDialog;
