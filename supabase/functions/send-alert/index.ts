import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const isValidString = (str: string, maxLength: number = 100): boolean => {
  return typeof str === 'string' && str.trim().length > 0 && str.length <= maxLength;
};

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const sanitizeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

interface AlertRequest {
  userId: string;
  userName: string;
  contactEmail: string;
  contactName: string;
  contactId: string;
  hoursOverdue: number;
  notificationMethod: 'email' | 'sms';
  phone?: string;
  internalSecret: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate internal secret to ensure only check-overdue can call this
    const expectedSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!body.internalSecret || body.internalSecret !== expectedSecret) {
      console.error("Unauthorized access attempt to send-alert");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, userName, contactEmail, contactName, contactId, hoursOverdue, notificationMethod, phone }: AlertRequest = body;

    // Input validation
    if (!isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: "Invalid userId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidString(userName)) {
      return new Response(
        JSON.stringify({ error: "Invalid userName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidEmail(contactEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid contactEmail" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidString(contactName)) {
      return new Response(
        JSON.stringify({ error: "Invalid contactName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof hoursOverdue !== 'number' || hoursOverdue < 0 || hoursOverdue > 8760) {
      return new Response(
        JSON.stringify({ error: "Invalid hoursOverdue" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize strings for HTML email
    const safeUserName = sanitizeHtml(userName);
    const safeContactName = sanitizeHtml(contactName);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle SMS notification
    if (notificationMethod === 'sms' && phone) {
      console.log(`SMS notification requested for ${phone} - SMS not implemented yet, falling back to email`);
      // TODO: Implement SMS via Twilio or similar when user provides API keys
      // For now, we'll send email as fallback and log a note
    }

    console.log(`Sending alert for user ${safeUserName} to ${contactEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Je Vais Bien <onboarding@resend.dev>",
      to: [contactEmail],
      subject: `⚠️ Alerte: ${safeUserName} n'a pas fait son check-in`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; font-size: 24px;">⚠️ Alerte de sécurité</h1>
          <p style="font-size: 18px; color: #333;">Bonjour ${safeContactName},</p>
          <p style="font-size: 18px; color: #333;">
            <strong>${safeUserName}</strong> n'a pas confirmé qu'il/elle allait bien depuis plus de <strong>${hoursOverdue} heures</strong>.
          </p>
          <p style="font-size: 18px; color: #333;">
            Merci de le/la contacter pour vérifier que tout va bien.
          </p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 14px; color: #666;">
            Cet email a été envoyé automatiquement par l'application "Je Vais Bien".
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the alert in database
    await supabase.from("alerts_log").insert({
      user_id: userId,
      contact_id: contactId || null,
      status: "success",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
