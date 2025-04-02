
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
  sendHighlightByEmail 
} from '@/utils/highlights';
import { EmailFrequency } from '@/types/highlight';
import { Mail } from 'lucide-react';
import { format } from 'date-fns';

const EmailSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(loadEmailSettings());
  const [isSending, setIsSending] = useState(false);
  
  const nextDate = getNextScheduledDate(settings);

  useEffect(() => {
    setSettings(loadEmailSettings());
  }, []);

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

  const handleSaveSettings = () => {
    if (settings.enabled && !settings.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to enable scheduled highlights.",
        variant: "destructive"
      });
      return;
    }
    
    saveEmailSettings(settings);
    toast({
      title: "Settings saved",
      description: "Your email settings have been updated."
    });
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
      const result = await sendHighlightByEmail();
      
      if (result) {
        toast({
          title: "Test email sent",
          description: "A random highlight has been sent to your email address."
        });
      } else {
        toast({
          title: "Failed to send test email",
          description: "Please check your settings and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending the test email.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
        <CardDescription>
          Configure how and when you receive your highlights by email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="text-base">
              Enable Email Delivery
            </Label>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={handleEnabledChange}
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
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="frequency">Delivery Frequency</Label>
          <Select 
            value={settings.frequency} 
            onValueChange={handleFrequencyChange}
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
        
        {settings.lastSent && (
          <div className="pt-2 border-t text-sm text-muted-foreground">
            <p>Last email sent: {format(settings.lastSent, 'MMMM d, yyyy')}</p>
            {nextDate && (
              <p>Next scheduled: {format(nextDate, 'MMMM d, yyyy')}</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleSendTestEmail}
          disabled={!settings.email || isSending}
        >
          <Mail className="h-4 w-4" />
          Send Test Email
        </Button>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
};

export default EmailSettings;
