
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ScheduledEmailCheckerProps {
  onCheck: () => void;
  isChecking: boolean;
  lastChecked: Date | null;
  debugInfo: any;
}

const ScheduledEmailChecker: React.FC<ScheduledEmailCheckerProps> = ({
  onCheck,
  isChecking,
  lastChecked,
  debugInfo,
}) => {
  return (
    <div className="pt-4 border-t mt-4">
      <Button
        variant="secondary"
        onClick={onCheck}
        disabled={isChecking}
        className="w-full gap-2"
        size="sm"
      >
        <Clock className="h-4 w-4" />
        {isChecking ? "Checking..." : "Check If Email Should Be Sent Now"}
      </Button>
      {lastChecked && (
        <p className="text-xs text-muted-foreground mt-2">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
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
    </div>
  );
};

export default ScheduledEmailChecker;
