
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HighlightData {
  text: string;
  author?: string;
  source?: string;
  category?: string;
}

interface EmailRequest {
  email: string;
  highlight: HighlightData | HighlightData[];
  deliveryTime?: string;
  count?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Receiving email request');
    const { email, highlight, deliveryTime, count = 1 }: EmailRequest = await req.json();

    if (!email) {
      throw new Error("Email address is required");
    }

    if (!highlight) {
      throw new Error("Highlight content is required");
    }

    console.log(`Sending highlight to ${email}`);
    console.log(`Number of highlights: ${Array.isArray(highlight) ? highlight.length : 1}`);
    if (deliveryTime) {
      console.log(`Scheduled for daily delivery at: ${deliveryTime}`);
    }

    // Format the current date for the subject line
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    
    // Process highlights (single or multiple)
    const highlightsArray = Array.isArray(highlight) ? highlight : [highlight];
    
    // Create HTML content for all highlights
    let highlightsHtml = '';
    
    highlightsArray.forEach((item, index) => {
      const source = item.source ? `<em>${item.source}</em>` : '';
      const author = item.author ? `<strong>${item.author}</strong>` : '';
      const attribution = (author || source) ? `<p style="text-align: right; font-size: 14px; margin-top: 10px;">${author} ${source}</p>` : '';
      const category = item.category ? `<span style="color: #6c7693; font-size: 12px; text-transform: uppercase;">${item.category}</span>` : '';
      
      highlightsHtml += `
        <div style="margin: 20px 0; padding: 20px; border-left: 4px solid #5b6cf9; background-color: #f9f9fb;">
          ${category}
          <p style="font-size: 18px; line-height: 1.6; color: #374151;">
            "${item.text}"
          </p>
          ${attribution}
        </div>
      `;
      
      // Add a separator between highlights, except for the last one
      if (index < highlightsArray.length - 1) {
        highlightsHtml += '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">';
      }
    });

    const emailResponse = await resend.emails.send({
      from: "Sparkler Highlights <onboarding@resend.dev>",
      to: [email],
      subject: `Your Highlights for ${formattedDate}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h2 style="color: #374151; margin-bottom: 20px;">Your Sparkler Highlights</h2>
          ${highlightsHtml}
          <p style="font-size: 14px; color: #6c7693;">
            Sent from <a href="https://lovable.app" style="color: #5b6cf9; text-decoration: none;">Sparkler</a>, your personal highlights library.
          </p>
          ${deliveryTime ? `<p style="font-size: 12px; color: #6c7693;">Scheduled delivery time: ${deliveryTime}</p>` : ''}
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-highlight function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
