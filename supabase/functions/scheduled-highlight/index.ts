
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
    // Get all registered emails with enabled settings
    const { activeEmail } = await req.json();
    
    if (!activeEmail) {
      throw new Error('No active email provided');
    }
    
    console.log(`Executing 3-hour scheduled job for email: ${activeEmail}`);
    
    // Get a random highlight
    const highlight = await getRandomHighlight();
    if (!highlight) {
      throw new Error('No highlights available');
    }

    // Send the email
    const emailResponse = await sendEmailWithHighlight(activeEmail, highlight);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in scheduled highlight function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
    id: "sample-id",
    text: "This is a scheduled highlight sent every 3 hours",
    source: "Scheduled System",
    author: "Sparkler",
    category: "System",
    dateAdded: new Date(),
    favorite: false
  };
}

// Send an email with the highlight
async function sendEmailWithHighlight(email: string, highlight: Highlight) {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  // Format the current date for the subject line
  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  
  const source = highlight.source ? `<em>${highlight.source}</em>` : '';
  const author = highlight.author ? `<strong>${highlight.author}</strong>` : '';
  const attribution = (author || source) ? `<p style="text-align: right; font-size: 14px; margin-top: 10px;">${author} ${source}</p>` : '';
  const category = highlight.category ? `<span style="color: #6c7693; font-size: 12px; text-transform: uppercase;">${highlight.category}</span>` : '';

  return resend.emails.send({
    from: "Sparkler 3-Hour Highlights <onboarding@resend.dev>",
    to: [email],
    subject: `Your 3-Hour Highlight: ${formattedDate}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <h2 style="color: #374151; margin-bottom: 20px;">Your 3-Hour Sparkler Highlight</h2>
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
        <p style="font-size: 12px; color: #6c7693;">This is an automated 3-hour scheduled highlight.</p>
      </div>
    `,
  });
}

serve(handler);
