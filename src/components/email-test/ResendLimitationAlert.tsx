
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ResendLimitationAlertProps {
  show: boolean;
}

const ResendLimitationAlert: React.FC<ResendLimitationAlertProps> = ({ show }) => {
  if (!show) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Resend Free Tier Limitation</AlertTitle>
      <AlertDescription>
        With Resend's free tier, you can only send emails to the email address linked to your Resend account (appears to be t@tpan.xyz).
        To send emails to other addresses like thomaskypan@gmail.com, you need to verify a domain in your Resend account.
      </AlertDescription>
    </Alert>
  );
};

export default ResendLimitationAlert;
