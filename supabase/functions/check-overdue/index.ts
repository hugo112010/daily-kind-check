import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REMINDER_HOURS_BEFORE = 2;

// Input sanitization for HTML
const sanitizeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for overdue users and sending reminders...");

    // Get all users who have completed onboarding
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .eq("has_completed_onboarding", true);

    if (profilesError) throw profilesError;

    const now = new Date();
    let alertsSent = 0;
    let remindersSent = 0;

    for (const profile of profiles || []) {
      if (!profile.last_checkin_at) continue;

      const lastCheckin = new Date(profile.last_checkin_at);
      const deadlineMs = profile.checkin_interval_hours * 60 * 60 * 1000;
      const deadline = new Date(lastCheckin.getTime() + deadlineMs);
      const reminderTime = new Date(deadline.getTime() - REMINDER_HOURS_BEFORE * 60 * 60 * 1000);

      // Sanitize user name for email HTML
      const safeName = sanitizeHtml(profile.name || 'Utilisateur');

      // Check if user is overdue
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
          console.log(`Skipping alert for ${profile.name} - alert already sent recently`);
          continue;
        }

        // Get emergency contacts
        const { data: contacts } = await supabase
          .from("emergency_contacts")
          .select("*")
          .eq("user_id", profile.user_id);

        for (const contact of contacts || []) {
          const safeContactName = sanitizeHtml(contact.name);
          console.log(`Sending alert for ${profile.name} to ${contact.email}`);

          try {
            // Handle notification based on user preference
            if (profile.notification_method === 'sms' && profile.phone) {
              console.log(`SMS notification requested for ${profile.phone} - falling back to email (SMS not implemented)`);
              // TODO: Implement SMS via Twilio when API keys are provided
            }

            await resend.emails.send({
              from: "Je Vais Bien <onboarding@resend.dev>",
              to: [contact.email],
              subject: `⚠️ Alerte: ${safeName} n'a pas fait son check-in`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #dc2626; font-size: 24px;">⚠️ Alerte de sécurité</h1>
                  <p style="font-size: 18px; color: #333;">Bonjour ${safeContactName},</p>
                  <p style="font-size: 18px; color: #333;">
                    <strong>${safeName}</strong> n'a pas confirmé qu'il/elle allait bien depuis plus de <strong>${profile.checkin_interval_hours + hoursOverdue} heures</strong>.
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
            // Log detailed error server-side only (not exposed to users)
            console.error(`Failed to send alert email to ${contact.email}:`, emailError);
            
            // Store sanitized error message - never expose internal system details
            const sanitizedErrorMessage = "L'envoi de l'email a échoué. Veuillez vérifier l'adresse email du contact.";
            
            await supabase.from("alerts_log").insert({
              user_id: profile.user_id,
              contact_id: contact.id,
              status: "failed",
              error_message: sanitizedErrorMessage,
            });
          }
        }
      }
      // Check if user should receive a reminder (2h before deadline)
      else if (now >= reminderTime && now < deadline) {
        // Only send reminder if interval is > 2 hours (otherwise no time for reminder)
        if (profile.checkin_interval_hours <= REMINDER_HOURS_BEFORE) {
          continue;
        }

        // Check if we already sent a reminder for this deadline
        const { data: existingReminders } = await supabase
          .from("reminders_log")
          .select("*")
          .eq("user_id", profile.user_id)
          .eq("deadline_at", deadline.toISOString());

        if (existingReminders && existingReminders.length > 0) {
          console.log(`Skipping reminder for ${profile.name} - already sent for this deadline`);
          continue;
        }

        // Send reminder email to the user
        if (profile.email) {
          console.log(`Sending reminder to ${profile.name} at ${profile.email}`);

          try {
            await resend.emails.send({
              from: "Je Vais Bien <onboarding@resend.dev>",
              to: [profile.email],
              subject: `🔔 Rappel: N'oubliez pas votre check-in`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #f59e0b; font-size: 24px;">🔔 Rappel de check-in</h1>
                  <p style="font-size: 18px; color: #333;">Bonjour ${safeName},</p>
                  <p style="font-size: 18px; color: #333;">
                    Votre check-in expire dans <strong>moins de 2 heures</strong>.
                  </p>
                  <p style="font-size: 18px; color: #333;">
                    N'oubliez pas de confirmer que vous allez bien pour éviter d'alerter vos contacts d'urgence.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://id-preview--7d9503a8-c3eb-4d1c-90f4-fe93e65e1850.lovable.app/dashboard" 
                       style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                      Faire mon check-in maintenant
                    </a>
                  </div>
                  <hr style="border: 1px solid #eee; margin: 30px 0;" />
                  <p style="font-size: 14px; color: #666;">
                    Cet email a été envoyé automatiquement par l'application "Je Vais Bien".
                  </p>
                </div>
              `,
            });

            await supabase.from("reminders_log").insert({
              user_id: profile.user_id,
              deadline_at: deadline.toISOString(),
            });

            remindersSent++;
            console.log(`Reminder sent to ${profile.name}`);
          } catch (emailError: any) {
            console.error(`Failed to send reminder to ${profile.email}:`, emailError);
          }
        }
      }
    }

    console.log(`Check complete. Alerts sent: ${alertsSent}, Reminders sent: ${remindersSent}`);

    return new Response(
      JSON.stringify({ success: true, alertsSent, remindersSent }),
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
