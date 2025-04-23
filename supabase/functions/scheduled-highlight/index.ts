import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

interface Highlight {
  id: string;
  text: string;
  source: string;
  author: string;
  category: string;
  dateAdded: Date;
  favorite: boolean;
}

interface EmailSettings {
  email: string;
  frequency: string;
  enabled: boolean;
  lastSent?: Date;
  deliveryTime: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Scheduled highlight function triggered");
    
    // Get active email from request body
    const requestBody = await req.json().catch(() => ({}));
    const { activeEmail, currentDate, isTest = false } = requestBody;
    
    if (!activeEmail) {
      console.error("No active email provided in request body");
      throw new Error('No active email provided');
    }
    
    console.log(`Executing scheduled job for email: ${activeEmail}`);
    console.log(`Current date from client: ${currentDate || 'Not provided'}`);
    console.log(`Is test run: ${isTest}`);
    
    // Get a random highlight
    const highlight = await getRandomHighlight();
    if (!highlight) {
      console.error("No highlights available to send");
      throw new Error('No highlights available');
    }
    
    console.log("Random highlight selected:", highlight);

    // Send the email
    try {
      const emailResponse = await sendEmailWithHighlight(activeEmail, highlight, currentDate);
      console.log("Email sent successfully:", emailResponse);
      
      return new Response(JSON.stringify({ success: true, data: emailResponse, emailSent: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (emailError: any) {
      // Check if this is a Resend permission error
      if (emailError.message?.includes('can only send testing emails to your own email address')) {
        console.warn("Resend free tier limitation:", emailError.message);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Resend free tier limitation: You can only send test emails to the email address used to create your Resend account. Please verify a domain or use that email address.", 
            resendError: true,
            emailSent: false 
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Other email error
      throw emailError;
    }
  } catch (error: any) {
    console.error("Error in scheduled highlight function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, emailSent: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Fetch a random highlight from local storage (for testing)
async function getRandomHighlight(): Promise<Highlight | null> {
  // Here we would fetch from database in a real implementation
  // For now, we'll create a sample highlight
  return {
    id: "scheduled-highlight",
    text: "This is a scheduled highlight sent automatically by the system.",
    source: "Scheduled Delivery System",
    author: "Sparkler",
    category: "System",
    dateAdded: new Date(),
    favorite: false
  };
}

// Send an email with the highlight
async function sendEmailWithHighlight(email: string, highlight: Highlight, currentDateString?: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable not set");
    throw new Error("Email service configuration missing");
  }

  const resend = new Resend(resendApiKey);
  
  // Format the current date for the subject line
  const currentDateObj = currentDateString ? new Date(currentDateString) : new Date();
  const formattedDate = formatDateInTimeZone(currentDateObj);
  
  const source = highlight.source ? `<em>${highlight.source}</em>` : '';
  const author = highlight.author ? `<strong>${highlight.author}</strong>` : '';
  const attribution = (author || source) ? `<p style="text-align: right; font-size: 14px; margin-top: 10px;">${author} ${source}</p>` : '';
  const category = highlight.category ? `<span style="color: #6c7693; font-size: 12px; text-transform: uppercase;">${highlight.category}</span>` : '';

  console.log(`Sending scheduled email to: ${email}`);
  
  try {
    const result = await resend.emails.send({
      from: "Sparkler Scheduled Highlights <onboarding@resend.dev>",
      to: [email],
      subject: `Your Scheduled Highlight: ${formattedDate}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h2 style="color: #374151; margin-bottom: 20px;">Your Scheduled Sparkler Highlight</h2>
          <div style="margin: 20px 0; padding: 20px; border-left: 4px solid #5b6cf9; background-color: #f9f9fb;">
            ${category}
            <p style="font-size: 18px; line-height: 1.6; color: #374151;">
              "${highlight.text}"
            </p>
            ${attribution}
          </div>
          <p style="font-size: 14px; color: #6c7693;">
            Sent from <a href="https://lovable.app" style="color: #5b6cf9; text-decoration: none;">Sparkler</a>, your personal highlights library.
          </p>
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6c7693;">This is an automated scheduled highlight delivery.</p>
            <p style="font-size: 12px; color: #6c7693;">Delivery time (Pacific): ${formattedDate}</p>
            <p style="font-size: 12px; color: #6c7693;">DEBUG: Email address: ${email}</p>
          </div>
        </div>
      `,
    });
    
    console.log("Email send response:", result);
    return result;
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    throw error;
  }
}

// Function to format date in a specific time zone
const formatDateInTimeZone = (date: Date, timeZone: string = 'America/Los_Angeles') => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

serve(handler);
