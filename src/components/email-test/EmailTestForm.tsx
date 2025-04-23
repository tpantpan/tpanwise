
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Info } from 'lucide-react';

interface EmailTestFormProps {
  email: string;
  setEmail: (email: string) => void;
  onSendRegular: () => void;
  onSendTest: () => void;
  isSending: boolean;
}

const EmailTestForm: React.FC<EmailTestFormProps> = ({
  email,
  setEmail,
  onSendRegular,
  onSendTest,
  isSending,
}) => {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {email === 't@tpan.xyz' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Info className="h-3 w-3 mr-1" /> This email should work with Resend
        </Badge>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button 
          variant="outline"
          onClick={onSendRegular}
          disabled={isSending || !email}
          className="gap-2 flex-1"
          size="sm"
        >
          <Mail className="h-4 w-4" />
          Test Regular Email
        </Button>
        <Button 
          onClick={onSendTest}
          disabled={isSending || !email}
          className="gap-2 flex-1"
          size="sm"
        >
          <Mail className="h-4 w-4" />
          Test 3-Hour Scheduled Email
        </Button>
      </div>
    </div>
  );
};

export default EmailTestForm;
