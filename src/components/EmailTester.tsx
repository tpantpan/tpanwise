
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerScheduledEmail, sendHighlightByEmail } from '@/utils/highlights';
import { useToast } from '@/components/ui/use-toast';
import { Mail } from 'lucide-react';

const EmailTester: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSendTest = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    try {
      const result = await triggerScheduledEmail(email);
      
      if (result) {
        toast({
          title: "Test sent",
          description: "A test scheduled email has been sent. Please check your inbox.",
        });
      } else {
        toast({
          title: "Failed to send test",
          description: "There was an issue sending the scheduled test email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the test.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSendRegular = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    try {
      const result = await sendHighlightByEmail(email, 1);
      
      if (result) {
        toast({
          title: "Test sent",
          description: "A test regular highlight email has been sent. Please check your inbox.",
        });
      } else {
        toast({
          title: "Failed to send test",
          description: "There was an issue sending the test regular email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the test.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Email Testing Center</CardTitle>
        <CardDescription>
          Test the email functionality directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={handleSendRegular}
          disabled={isSending || !email}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Test Regular Email
        </Button>
        <Button 
          onClick={handleSendTest}
          disabled={isSending || !email}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Test Scheduled Email
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailTester;
