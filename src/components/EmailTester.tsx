
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerScheduledEmail, sendHighlightByEmail, checkAndSendScheduledEmail, loadEmailSettings } from '@/utils/highlights';
import { useToast } from '@/components/ui/use-toast';
import { Mail, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const EmailTester: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCheckingSchedule, setIsCheckingSchedule] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Load the email from settings when component mounts
  useEffect(() => {
    const loadEmailFromSettings = async () => {
      const settings = await loadEmailSettings();
      if (settings.email) {
        setEmail(settings.email);
      }
    };
    
    loadEmailFromSettings();
  }, []);
  
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
  
  const handleCheckScheduledEmail = async () => {
    setIsCheckingSchedule(true);
    setDebugInfo(null);
    
    try {
      const settings = await loadEmailSettings();
      const nextSchedule = settings.enabled ? 
        `${settings.frequency} at ${settings.deliveryTime}` : 
        'Email delivery not enabled';
      
      const shouldSend = await checkAndSendScheduledEmail();
      
      setLastChecked(new Date());
      
      setDebugInfo({
        settings,
        shouldSendNow: shouldSend,
        currentTime: new Date().toISOString()
      });
      
      toast({
        title: shouldSend ? "Email was sent!" : "No email needed at this time",
        description: shouldSend ? 
          "The system detected it's time to send an email and has done so." : 
          "Based on your schedule, it's not time to send an email yet.",
      });
    } catch (error) {
      console.error('Error checking schedule:', error);
      toast({
        title: "Error",
        description: "Failed to check email schedule",
        variant: "destructive"
      });
    } finally {
      setIsCheckingSchedule(false);
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
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={handleSendRegular}
            disabled={isSending || !email}
            className="gap-2 flex-1"
            size="sm"
          >
            <Mail className="h-4 w-4" />
            Test Regular Email
          </Button>
          
          <Button 
            onClick={handleSendTest}
            disabled={isSending || !email}
            className="gap-2 flex-1"
            size="sm"
          >
            <Mail className="h-4 w-4" />
            Test 3-Hour Scheduled Email
          </Button>
        </div>
        
        <div className="pt-4 border-t mt-4">
          <Button
            variant="secondary"
            onClick={handleCheckScheduledEmail}
            disabled={isCheckingSchedule}
            className="w-full gap-2"
            size="sm"
          >
            <Clock className="h-4 w-4" />
            {isCheckingSchedule ? "Checking..." : "Check If Email Should Be Sent Now"}
          </Button>
          
          {lastChecked && (
            <p className="text-xs text-muted-foreground mt-2">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {debugInfo && (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="debug-info">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Debug Information
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-slate-50 p-3 rounded-md text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-xs text-muted-foreground">
          If scheduled emails aren't arriving, try checking your spam folder or trying a different email address.
        </p>
      </CardFooter>
    </Card>
  );
};

export default EmailTester;
