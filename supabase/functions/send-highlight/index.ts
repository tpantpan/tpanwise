
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    
    const { email, highlight } = await req.json();
    
    if (!email || !highlight) {
      return new Response(
        JSON.stringify({ error: "Email and highlight are required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Sending highlight to ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: "Sparkler <onboarding@resend.dev>",
      to: [email],
      subject: "Your Daily Highlight from Sparkler",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Your Sparkler Highlight</h1>
          <div style="border-left: 4px solid #4F46E5; padding: 10px 20px; background-color: #F3F4F6; margin: 20px 0;">
            <p style="font-size: 18px; line-height: 1.6;">"${highlight.text}"</p>
            ${highlight.author ? `<p style="font-style: italic; text-align: right;">— ${highlight.author}</p>` : ''}
            ${highlight.source ? `<p style="color: #6B7280; font-size: 14px;">Source: ${highlight.source}</p>` : ''}
          </div>
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            This email was sent according to your preferences in Sparkler, your personal highlights library.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in send-highlight function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
