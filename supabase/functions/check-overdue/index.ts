import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for overdue users...");

    // Get all users who have completed onboarding
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .eq("has_completed_onboarding", true);

    if (profilesError) throw profilesError;

    const now = new Date();
    let alertsSent = 0;

    for (const profile of profiles || []) {
      if (!profile.last_checkin_at) continue;

      const lastCheckin = new Date(profile.last_checkin_at);
      const deadlineMs = profile.checkin_interval_hours * 60 * 60 * 1000;
      const deadline = new Date(lastCheckin.getTime() + deadlineMs);

      if (now > deadline) {
        const hoursOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60));
        
        // Check if we already sent an alert recently (within last 4 hours)
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        const { data: recentAlerts } = await supabase
          .from("alerts_log")
          .select("*")
          .eq("user_id", profile.user_id)
          .gte("alert_sent_at", fourHoursAgo.toISOString());

        if (recentAlerts && recentAlerts.length > 0) {
          console.log(`Skipping ${profile.name} - alert already sent recently`);
          continue;
        }

        // Get emergency contacts
        const { data: contacts } = await supabase
          .from("emergency_contacts")
          .select("*")
          .eq("user_id", profile.user_id);

        for (const contact of contacts || []) {
          console.log(`Sending alert for ${profile.name} to ${contact.email}`);

          try {
            await resend.emails.send({
              from: "Je Vais Bien <onboarding@resend.dev>",
              to: [contact.email],
              subject: `⚠️ Alerte: ${profile.name || 'Utilisateur'} n'a pas fait son check-in`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #dc2626; font-size: 24px;">⚠️ Alerte de sécurité</h1>
                  <p style="font-size: 18px; color: #333;">Bonjour ${contact.name},</p>
                  <p style="font-size: 18px; color: #333;">
                    <strong>${profile.name || 'Votre proche'}</strong> n'a pas confirmé qu'il/elle allait bien depuis plus de <strong>${profile.checkin_interval_hours + hoursOverdue} heures</strong>.
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

            await supabase.from("alerts_log").insert({
              user_id: profile.user_id,
              contact_id: contact.id,
              status: "success",
            });

            alertsSent++;
          } catch (emailError: any) {
            console.error(`Failed to send email to ${contact.email}:`, emailError);
            await supabase.from("alerts_log").insert({
              user_id: profile.user_id,
              contact_id: contact.id,
              status: "failed",
              error_message: emailError.message,
            });
          }
        }
      }
    }

    console.log(`Check complete. Alerts sent: ${alertsSent}`);

    return new Response(
      JSON.stringify({ success: true, alertsSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error checking overdue users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
