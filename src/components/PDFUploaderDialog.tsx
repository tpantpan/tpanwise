
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import PDFUploader from './PDFUploader';

interface PDFUploaderDialogProps {
  onSuccess?: () => void;
}

const PDFUploaderDialog: React.FC<PDFUploaderDialogProps> = ({ onSuccess }) => {
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
          <FileText className="h-4 w-4" />
          Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload PDF</DialogTitle>
          <DialogDescription>
            Upload a PDF file to extract highlights automatically.
          </DialogDescription>
        </DialogHeader>
        <PDFUploader onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default PDFUploaderDialog;
