
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ScheduledInfoAlertProps {
  scheduledInfo: string | null;
}

const ScheduledInfoAlert: React.FC<ScheduledInfoAlertProps> = ({ scheduledInfo }) => {
  if (!scheduledInfo) return null;
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>About Scheduled Emails</AlertTitle>
      <AlertDescription>
        {scheduledInfo}
      </AlertDescription>
    </Alert>
  );
};

export default ScheduledInfoAlert;
