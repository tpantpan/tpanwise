
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import EmailTestForm from './email-test/EmailTestForm';
import ResendLimitationAlert from './email-test/ResendLimitationAlert';
import ScheduledInfoAlert from './email-test/ScheduledInfoAlert';
import ScheduledEmailChecker from './email-test/ScheduledEmailChecker';
import { triggerScheduledEmail, sendHighlightByEmail, checkAndSendScheduledEmail, loadEmailSettings } from '@/utils/highlights';
import { useToast } from '@/components/ui/use-toast';

const EmailTester: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCheckingSchedule, setIsCheckingSchedule] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [resendLimitationAlert, setResendLimitationAlert] = useState(false);
  const [scheduledInfo, setScheduledInfo] = useState<string | null>(null);

  useEffect(() => {
    const loadEmailFromSettings = async () => {
      const settings = await loadEmailSettings();
      if (settings.email) {
        setEmail(settings.email);
      }
      if (settings.enabled && settings.email && settings.email !== 't@tpan.xyz') {
        setScheduledInfo("Note: With Resend's free tier, scheduled emails will be sent to t@tpan.xyz instead of the email in settings.");
      } else {
        setScheduledInfo(null);
      }
    };
    loadEmailFromSettings();
  }, []);

  const handleSendTest = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test.",
        variant: "destructive",
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
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error sending test:', error);
      if (error.resendError) {
        setResendLimitationAlert(true);
        toast({
          title: "Resend Free Tier Limitation",
          description: "You can only send test emails to your Resend account email. Try using t@tpan.xyz instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while sending the test.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendRegular = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test.",
        variant: "destructive",
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
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error sending test:', error);
      if (error.resendError) {
        setResendLimitationAlert(true);
        toast({
          title: "Resend Free Tier Limitation",
          description: "You can only send test emails to your Resend account email. Try using t@tpan.xyz instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while sending the test.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckScheduledEmail = async () => {
    setIsCheckingSchedule(true);
    setDebugInfo(null);

    try {
      const settings = await loadEmailSettings();
      const shouldSend = await checkAndSendScheduledEmail();
      setLastChecked(new Date());
      setDebugInfo({
        settings,
        shouldSendNow: shouldSend,
        currentTime: new Date().toISOString(),
        scheduledRecipient: shouldSend ? 't@tpan.xyz' : null,
      });
      toast({
        title: shouldSend ? "Email was sent!" : "No email needed at this time",
        description: shouldSend ?
          "The system detected it's time to send an email and has done so to t@tpan.xyz." :
          "Based on your schedule, it's not time to send an email yet.",
      });
      if (settings.enabled && settings.email && settings.email !== 't@tpan.xyz') {
        setScheduledInfo("Note: With Resend's free tier, scheduled emails will be sent to t@tpan.xyz instead of the email in settings.");
      } else {
        setScheduledInfo(null);
      }
    } catch (error) {
      console.error('Error checking schedule:', error);
      toast({
        title: "Error",
        description: "Failed to check email schedule",
        variant: "destructive",
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
        <ResendLimitationAlert show={resendLimitationAlert} />
        <ScheduledInfoAlert scheduledInfo={scheduledInfo} />
        <EmailTestForm
          email={email}
          setEmail={setEmail}
          onSendRegular={handleSendRegular}
          onSendTest={handleSendTest}
          isSending={isSending}
        />
        <ScheduledEmailChecker
          onCheck={handleCheckScheduledEmail}
          isChecking={isCheckingSchedule}
          lastChecked={lastChecked}
          debugInfo={debugInfo}
        />
      </CardContent>
      <CardFooter className="flex flex-col justify-center border-t pt-4 gap-2">
        <p className="text-xs text-muted-foreground">
          If scheduled emails aren't arriving, try checking your spam folder or trying a different email address.
        </p>
        <div className="text-xs text-muted-foreground p-2 bg-slate-50 rounded-md">
          <p className="font-medium">Troubleshooting Tips:</p>
          <ul className="list-disc pl-4 mt-1">
            <li>Use t@tpan.xyz for testing while on Resend's free tier</li>
            <li>To use other email addresses, verify a domain on <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com/domains</a></li>
            <li>Check both inbox and spam folders</li>
            <li>Ensure your email settings have the correct delivery time</li>
            <li>All scheduled emails on the free tier will be sent to t@tpan.xyz regardless of email settings</li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmailTester;
