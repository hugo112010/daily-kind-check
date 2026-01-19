import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  userId: string;
  userName: string;
  contactEmail: string;
  contactName: string;
  hoursOverdue: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userName, contactEmail, contactName, hoursOverdue }: AlertRequest = await req.json();

    console.log(`Sending alert for user ${userName} to ${contactEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Je Vais Bien <onboarding@resend.dev>",
      to: [contactEmail],
      subject: `⚠️ Alerte: ${userName} n'a pas fait son check-in`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; font-size: 24px;">⚠️ Alerte de sécurité</h1>
          <p style="font-size: 18px; color: #333;">Bonjour ${contactName},</p>
          <p style="font-size: 18px; color: #333;">
            <strong>${userName}</strong> n'a pas confirmé qu'il/elle allait bien depuis plus de <strong>${hoursOverdue} heures</strong>.
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("alerts_log").insert({
      user_id: userId,
      contact_id: null,
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
