import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  loadEmailSettings, 
  saveEmailSettings, 
  getNextScheduledDate, 
  sendHighlightByEmail,
  triggerScheduledEmail
} from '@/utils/highlights';
import { EmailFrequency } from '@/types/highlight';
import { Mail, Clock, AlertTriangle, Hash } from 'lucide-react';
import { format } from 'date-fns';

const EmailSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    email: '',
    frequency: 'daily' as EmailFrequency,
    enabled: false,
    lastSent: undefined as Date | undefined,
    deliveryTime: '09:00',
    highlightCount: 1
  });
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTestingScheduled, setIsTestingScheduled] = useState(false);
  
  const nextDate = getNextScheduledDate(settings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const emailSettings = await loadEmailSettings();
        setSettings({
          email: emailSettings.email,
          frequency: emailSettings.frequency,
          enabled: emailSettings.enabled,
          lastSent: emailSettings.lastSent,
          deliveryTime: emailSettings.deliveryTime || '09:00',
          highlightCount: emailSettings.highlightCount || 1
        });
      } catch (error) {
        console.error('Error loading email settings:', error);
        toast({
          title: "Error",
          description: "Failed to load email settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFrequencyChange = (value: string) => {
    setSettings(prev => ({ 
      ...prev, 
      frequency: value as EmailFrequency 
    }));
  };

  const handleEnabledChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, enabled: checked }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      deliveryTime: e.target.value
    }));
  };

  const handleHighlightCountChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      highlightCount: parseInt(value)
    }));
  };

  const handleSaveSettings = async () => {
    if (settings.enabled && !settings.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to enable scheduled highlights.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const success = await saveEmailSettings({
        email: settings.email,
        frequency: settings.frequency,
        enabled: settings.enabled,
        lastSent: settings.lastSent,
        deliveryTime: settings.deliveryTime,
        highlightCount: settings.highlightCount
      });
      
      if (success) {
        toast({
          title: "Settings saved",
          description: "Your email settings have been updated."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save email settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to send a test highlight.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const result = await sendHighlightByEmail(settings.email, settings.highlightCount);
      
      if (result) {
        toast({
          title: "Test email sent",
          description: `${settings.highlightCount} random highlight(s) have been sent to your email address.`
        });
        
        const updatedSettings = await loadEmailSettings();
        setSettings(prev => ({
          ...prev,
          lastSent: updatedSettings.lastSent,
          deliveryTime: updatedSettings.deliveryTime || prev.deliveryTime,
          highlightCount: updatedSettings.highlightCount || prev.highlightCount
        }));
      } else {
        toast({
          title: "Failed to send test email",
          description: "Please check your settings and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending the test email.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSendMissedEmail = async () => {
    if (!settings.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to send today's highlight.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const result = await sendHighlightByEmail(settings.email);
      
      if (result) {
        toast({
          title: "Today's highlight sent",
          description: "Your daily highlight has been delivered to your email."
        });
        
        const updatedSettings = await loadEmailSettings();
        setSettings(prev => ({
          ...prev,
          lastSent: updatedSettings.lastSent,
          deliveryTime: updatedSettings.deliveryTime || prev.deliveryTime
        }));
      } else {
        toast({
          title: "Failed to send email",
          description: "Please check your settings and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending daily email:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending today's highlight.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestScheduledEmail = async () => {
    if (!settings.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to test the 3-hour scheduled email.",
        variant: "destructive"
      });
      return;
    }
    
    setIsTestingScheduled(true);
    
    try {
      const result = await triggerScheduledEmail(settings.email);
      
      if (result) {
        toast({
          title: "3-hour scheduled email sent",
          description: "A test of the 3-hour scheduled email has been sent to your address."
        });
      } else {
        toast({
          title: "Failed to send scheduled email",
          description: "Please check your settings and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending scheduled test email:', error);
      toast({
        title: "Error",
        description: "An error occurred while testing the scheduled email.",
        variant: "destructive"
      });
    } finally {
      setIsTestingScheduled(false);
    }
  };

  const formatNextScheduledTime = (date: Date | null, time: string) => {
    if (!date) return null;
    
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    return scheduledDate;
  };
  
  const isDailyEmailMissed = () => {
    if (!settings.enabled || !settings.lastSent) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSentDay = new Date(
      settings.lastSent.getFullYear(), 
      settings.lastSent.getMonth(), 
      settings.lastSent.getDate()
    );
    
    return settings.frequency === 'daily' && lastSentDay < today;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
        <CardDescription>
          Configure how and when you receive your highlights by email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isDailyEmailMissed() && (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-700">Missed daily email</p>
              <p className="text-sm text-yellow-600">
                It looks like you didn't receive your daily highlight email. 
                You can send it now manually.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 bg-white border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                onClick={handleSendMissedEmail}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send today's highlight now"}
              </Button>
            </div>
          </div>
        )}
      
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="text-base">
              Enable Email Delivery
            </Label>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={handleEnabledChange}
              disabled={isSending}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Receive random highlights from your collection based on your preferred schedule
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={settings.email}
            onChange={handleChange}
            disabled={isSending}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Delivery Frequency</Label>
            <Select 
              value={settings.frequency} 
              onValueChange={handleFrequencyChange}
              disabled={isSending}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Delivery Time
            </Label>
            <Input
              id="deliveryTime"
              type="time"
              value={settings.deliveryTime}
              onChange={handleTimeChange}
              disabled={isSending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="highlightCount" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Highlights Per Email
            </Label>
            <Select 
              value={settings.highlightCount.toString()} 
              onValueChange={handleHighlightCountChange}
              disabled={isSending}
            >
              <SelectTrigger id="highlightCount">
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(10)].map((_, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {settings.lastSent && (
          <div className="pt-2 border-t text-sm text-muted-foreground">
            <p>Last email sent: {format(settings.lastSent, 'MMMM d, yyyy')}</p>
            {nextDate && formatNextScheduledTime(nextDate, settings.deliveryTime) && (
              <p>
                Next scheduled: {format(formatNextScheduledTime(nextDate, settings.deliveryTime)!, 'MMMM d, yyyy')} at {settings.deliveryTime}
              </p>
            )}
          </div>
        )}
        
        <div className="rounded-lg border p-4 mt-4">
          <h3 className="text-sm font-medium mb-2">3-Hour Scheduled Highlights</h3>
          <p className="text-sm text-muted-foreground mb-3">
            We've set up a special delivery that sends one highlight every 3 hours to your email address.
          </p>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleTestScheduledEmail}
            disabled={isTestingScheduled || !settings.email}
          >
            {isTestingScheduled ? "Sending..." : "Test 3-Hour Scheduled Email"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleSendTestEmail}
          disabled={!settings.email || isSending}
        >
          <Mail className="h-4 w-4" />
          {isSending ? "Sending..." : "Send Test Email"}
        </Button>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSending}
        >
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailSettings;
