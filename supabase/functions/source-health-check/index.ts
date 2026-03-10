import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_THRESHOLD_HOURS = 24;
const ALERT_COOLDOWN_HOURS = 24; // Don't re-alert for same source within this window

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all active sources with their last activity
    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("id, name, user_id, last_active, created_at")
      .eq("active", true);

    if (sourcesError) throw sourcesError;

    const now = new Date();
    const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);
    const cooldownThreshold = new Date(now.getTime() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);

    // Find stale sources
    const staleSources = (sources || []).filter((s) => {
      const lastActivity = s.last_active ? new Date(s.last_active) : null;
      // If never active, check if created more than 24h ago
      if (!lastActivity) {
        return new Date(s.created_at) < staleThreshold;
      }
      return lastActivity < staleThreshold;
    });

    if (staleSources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No stale sources found", alerts_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which ones were already alerted recently
    const staleIds = staleSources.map((s) => s.id);
    const { data: recentAlerts } = await supabase
      .from("source_alerts")
      .select("source_id, last_alerted_at")
      .in("source_id", staleIds)
      .eq("alert_type", "stale_source");

    const recentAlertMap = new Map(
      (recentAlerts || []).map((a) => [a.source_id, new Date(a.last_alerted_at)])
    );

    // Filter to only sources needing a new alert
    const sourcesToAlert = staleSources.filter((s) => {
      const lastAlerted = recentAlertMap.get(s.id);
      return !lastAlerted || lastAlerted < cooldownThreshold;
    });

    if (sourcesToAlert.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All stale sources already alerted recently", alerts_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by user for consolidated emails
    const userSourceMap = new Map<string, typeof sourcesToAlert>();
    for (const source of sourcesToAlert) {
      const existing = userSourceMap.get(source.user_id) || [];
      existing.push(source);
      userSourceMap.set(source.user_id, existing);
    }

    let alertsSent = 0;
    const errors: string[] = [];

    for (const [userId, userSources] of userSourceMap) {
      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;

      if (!userEmail) {
        errors.push(`No email for user ${userId}`);
        continue;
      }

      // Build email content
      const sourceList = userSources
        .map((s) => {
          const lastActive = s.last_active
            ? new Date(s.last_active).toLocaleString("en-US", { timeZone: "UTC" })
            : "Never";
          const hoursAgo = s.last_active
            ? Math.round((now.getTime() - new Date(s.last_active).getTime()) / (1000 * 60 * 60))
            : "N/A";
          return `• ${s.name} — Last active: ${lastActive} UTC (${hoursAgo}h ago)`;
        })
        .join("\n");

      const subject = `⚠️ APIally: ${userSources.length} source${userSources.length > 1 ? "s" : ""} stopped sending data`;
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">Source Health Alert</h2>
          <p>The following source${userSources.length > 1 ? "s have" : " has"} not sent any data in over ${STALE_THRESHOLD_HOURS} hours:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            ${userSources
              .map((s) => {
                const lastActive = s.last_active
                  ? new Date(s.last_active).toLocaleString("en-US", { timeZone: "UTC" })
                  : "Never";
                return `<p style="margin: 8px 0;"><strong>${s.name}</strong><br/><span style="color: #6b7280;">Last active: ${lastActive} UTC</span></p>`;
              })
              .join("")}
          </div>
          <p style="color: #6b7280; font-size: 14px;">Check that your data sources are configured correctly and sending data to the API endpoint.</p>
          <a href="https://apially.lovable.app" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 12px;">View Dashboard</a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This is an automated alert from APIally. You will not be alerted again for the same source within ${ALERT_COOLDOWN_HOURS} hours.</p>
        </div>
      `;

      // Send via Resend if configured
      if (resendApiKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "APIally Alerts <alerts@apially.com>",
              to: [userEmail],
              subject,
              html: htmlBody,
            }),
          });

          if (!emailRes.ok) {
            const errText = await emailRes.text();
            errors.push(`Resend error for ${userEmail}: ${errText}`);
            continue;
          }
        } catch (e) {
          errors.push(`Email send failed for ${userEmail}: ${e.message}`);
          continue;
        }
      } else {
        console.log(`[DRY RUN] Would email ${userEmail}: ${subject}\n${sourceList}`);
      }

      // Upsert alert records
      for (const source of userSources) {
        await supabase
          .from("source_alerts")
          .upsert(
            {
              source_id: source.id,
              user_id: userId,
              alert_type: "stale_source",
              last_alerted_at: now.toISOString(),
            },
            { onConflict: "source_id,alert_type" }
          );
      }

      alertsSent++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Health check complete`,
        stale_sources: staleSources.length,
        alerts_sent: alertsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Source health check error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
