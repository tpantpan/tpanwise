
import React from "react";

const EmailTesterTroubleshooting: React.FC = () => (
  <div className="text-xs text-muted-foreground p-2 bg-slate-50 rounded-md">
    <p className="font-medium">Troubleshooting Tips:</p>
    <ul className="list-disc pl-4 mt-1">
      <li>Use t@tpan.xyz for testing while on Resend's free tier</li>
      <li>
        To use other email addresses, verify a domain on{" "}
        <a
          href="https://resend.com/domains"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          resend.com/domains
        </a>
      </li>
      <li>Check both inbox and spam folders</li>
      <li>Ensure your email settings have the correct delivery time</li>
      <li>
        All scheduled emails on the free tier will be sent to t@tpan.xyz regardless of email settings
      </li>
      <li>
        Scheduled emails are automatically sent daily at 2:00 PM Pacific Time
      </li>
      <li>
        If scheduled emails are not arriving, verify the function logs using Supabase CLI: 
        <code className="ml-1 px-1 bg-slate-200 rounded">supabase functions logs scheduled-highlight</code>
      </li>
    </ul>
    
    <p className="font-medium mt-3">Scheduled Email Troubleshooting:</p>
    <ul className="list-disc pl-4 mt-1">
      <li>
        <strong>Verify deployment:</strong> Run <code className="px-1 bg-slate-200 rounded">supabase functions list</code> and confirm the CRON column appears for scheduled-highlight
      </li>
      <li>
        <strong>Check for errors:</strong> The function might run but fail - check logs with <code className="px-1 bg-slate-200 rounded">supabase functions logs scheduled-highlight --since 2h</code>
      </li>
      <li>
        <strong>Test manually:</strong> Invoke the function directly with <code className="px-1 bg-slate-200 rounded">supabase functions invoke scheduled-highlight</code>
      </li>
      <li>
        <strong>Resend restrictions:</strong> Free tier will only deliver to your Resend account email (t@tpan.xyz) until you verify a domain
      </li>
      <li>
        <strong>Quick test:</strong> Temporarily change schedule to <code className="px-1 bg-slate-200 rounded">* * * * *</code> (every minute) and redeploy to quickly verify the trigger works
      </li>
    </ul>
  </div>
);

export default EmailTesterTroubleshooting;
