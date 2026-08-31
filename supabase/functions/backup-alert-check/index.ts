import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// A backup attempt still "attempting" after this long is considered stuck
const STUCK_ATTEMPT_MINUTES = 45;
// A backup_logs row still "processing" without a heartbeat this long is stuck
const STUCK_LOG_MINUTES = 10;
// Don't re-alert about the same problem within this window
const ALERT_COOLDOWN_HOURS = 6;

type Issue = {
  key: string;
  userId: string;
  kind: "failed_run" | "stuck_run" | "failed_source" | "stuck_source";
  title: string;
  detail: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const stuckAttemptCutoff = new Date(now.getTime() - STUCK_ATTEMPT_MINUTES * 60 * 1000);
    const stuckLogCutoff = new Date(now.getTime() - STUCK_LOG_MINUTES * 60 * 1000);

    const issues: Issue[] = [];

    // 1) Backup attempts (whole-run level)
    const { data: attempts, error: attemptsError } = await supabase
      .from("backup_attempts")
      .select("id, user_id, attempt_date, status, error_message, created_at")
      .gte("created_at", since.toISOString());

    if (attemptsError) throw attemptsError;

    for (const a of attempts || []) {
      if (a.status === "failed") {
        issues.push({
          key: `attempt:${a.id}:failed`,
          userId: a.user_id,
          kind: "failed_run",
          title: `Backup run failed (${a.attempt_date})`,
          detail: a.error_message || "The backup run reported a failure with no error message.",
        });
      } else if (a.status === "attempting" && new Date(a.created_at) < stuckAttemptCutoff) {
        const mins = Math.round((now.getTime() - new Date(a.created_at).getTime()) / 60000);
        issues.push({
          key: `attempt:${a.id}:stuck`,
          userId: a.user_id,
          kind: "stuck_run",
          title: `Backup run stuck (${a.attempt_date})`,
          detail: `Still marked "attempting" after ${mins} minutes — the run most likely timed out.`,
        });
      }
    }

    // 2) Per-source backup logs
    // Only alert on backups targeting the last 24 hours. A manual retry creates
    // a NEW row for an OLD date — we key off backup_date (falling back to the
    // created_at date in LA) so stale re-runs never re-alert.
    const laDate = (d: Date) =>
      d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD
    const minTargetDate = laDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    const { data: logs, error: logsError } = await supabase
      .from("backup_logs")
      .select("id, user_id, source_id, file_name, status, error_message, created_at, updated_at, backup_date")
      .gte("created_at", since.toISOString());

    if (logsError) throw logsError;

    const sourceIds = [...new Set((logs || []).map((l) => l.source_id).filter(Boolean))] as string[];
    const sourceNames = new Map<string, string>();
    const sourcePaused = new Set<string>();
    const sourcePartner = new Set<string>();
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from("sources")
        .select("id, name, active, is_partner")
        .in("id", sourceIds);
      for (const s of sources || []) {
        sourceNames.set(s.id, s.name);
        if (!s.active) sourcePaused.add(s.id);
        if (s.is_partner) sourcePartner.add(s.id);
      }
    }

    const labelFor = (log: { source_id: string | null; file_name: string | null }) =>
      (log.source_id ? sourceNames.get(log.source_id) : null) || log.file_name || "Unknown source";

    for (const l of logs || []) {
      // Don't alert on paused sources or data partners — they intentionally don't back up data.
      if (l.source_id && (sourcePaused.has(l.source_id) || sourcePartner.has(l.source_id))) {
        continue;
      }

      if (l.status === "failed") {
        issues.push({
          key: `log:${l.id}:failed`,
          userId: l.user_id,
          kind: "failed_source",
          title: `Backup failed for ${labelFor(l)}`,
          detail: l.error_message || "No error message was recorded.",
        });
      } else if (l.status === "processing" && new Date(l.updated_at || l.created_at) < stuckLogCutoff) {
        const mins = Math.round(
          (now.getTime() - new Date(l.updated_at || l.created_at).getTime()) / 60000,
        );
        issues.push({
          key: `log:${l.id}:stuck`,
          userId: l.user_id,
          kind: "stuck_source",
          title: `Backup stuck for ${labelFor(l)}`,
          detail: `No progress update for ${mins} minutes — this source likely timed out mid-upload.`,
        });
      }
    }

    if (issues.length === 0) {
      return new Response(
        JSON.stringify({ success: true, issues: 0, alerts_sent: 0, message: "No backup problems detected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Cooldown filter
    const keys = issues.map((i) => i.key);
    const cooldownThreshold = new Date(now.getTime() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
    const { data: existingAlerts } = await supabase
      .from("backup_alerts")
      .select("alert_key, last_alerted_at")
      .in("alert_key", keys);

    const alertedAt = new Map(
      (existingAlerts || []).map((a) => [a.alert_key, new Date(a.last_alerted_at)]),
    );

    const toAlert = issues.filter((i) => {
      const prev = alertedAt.get(i.key);
      return !prev || prev < cooldownThreshold;
    });

    if (toAlert.length === 0) {
      return new Response(
        JSON.stringify({ success: true, issues: issues.length, alerts_sent: 0, message: "All issues already alerted recently" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4) Group per user and email
    const byUser = new Map<string, Issue[]>();
    for (const i of toAlert) {
      const list = byUser.get(i.userId) || [];
      list.push(i);
      byUser.set(i.userId, list);
    }

    let alertsSent = 0;
    const errors: string[] = [];

    for (const [userId, userIssues] of byUser) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;

      if (!email) {
        errors.push(`No email for user ${userId}`);
        continue;
      }

      const subject = `🚨 APIally: ${userIssues.length} backup issue${userIssues.length > 1 ? "s" : ""} detected`;
      const rows = userIssues
        .map(
          (i) => `
            <div style="padding: 12px 0; border-bottom: 1px solid #fee2e2;">
              <strong style="color:#991b1b;">${i.title}</strong><br/>
              <span style="color:#6b7280; font-size: 14px;">${i.detail}</span>
            </div>`,
        )
        .join("");

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="color:#dc2626; margin-bottom: 8px;">Backup Alert</h2>
          <p style="color:#374151;">The following backup problem${userIssues.length > 1 ? "s were" : " was"} detected in the last 24 hours:</p>
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding: 4px 16px; margin: 16px 0;">
            ${rows}
          </div>
          <a href="https://apially.com" style="display:inline-block; background:#2563eb; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">Open Backup Logs</a>
          <p style="color:#9ca3af; font-size:12px; margin-top:24px;">Automated alert from APIally. The same issue won't be re-sent within ${ALERT_COOLDOWN_HOURS} hours.</p>
        </div>`;

      if (resendApiKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "APIally Alerts <alerts@apially.com>",
              to: [email],
              subject,
              html,
            }),
          });
          if (!res.ok) {
            errors.push(`Resend error for ${email}: ${await res.text()}`);
            continue;
          }
        } catch (e) {
          errors.push(`Email send failed for ${email}: ${(e as Error).message}`);
          continue;
        }
      } else {
        console.log(`[DRY RUN] Would email ${email}: ${subject}`);
      }

      for (const i of userIssues) {
        await supabase.from("backup_alerts").upsert(
          {
            user_id: userId,
            alert_key: i.key,
            alert_type: i.kind,
            details: `${i.title} — ${i.detail}`.slice(0, 1000),
            last_alerted_at: now.toISOString(),
          },
          { onConflict: "alert_key,alert_type" },
        );
      }

      alertsSent += userIssues.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        issues: issues.length,
        alerts_sent: alertsSent,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("backup-alert-check error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
