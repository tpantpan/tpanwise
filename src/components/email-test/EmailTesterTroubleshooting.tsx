
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
  </div>
);

export default EmailTesterTroubleshooting;
