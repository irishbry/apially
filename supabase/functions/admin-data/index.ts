import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["bryan@rvnu.com"];

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await userClient.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    return { error: "Unauthorized", status: 401 };
  }

  const userEmail = claimsData.claims.email as string;
  if (!ADMIN_EMAILS.includes(userEmail)) {
    return { error: "Forbidden", status: 403 };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  return { adminClient };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await verifyAdmin(req);
    if ("error" in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { adminClient } = result;

    // Handle POST actions
    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      if (action === "toggle_source") {
        const { source_id, active } = body;
        const { error } = await adminClient
          .from("sources")
          .update({ active })
          .eq("id", source_id);
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Source ${active ? "activated" : "deactivated"}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "source_daily_counts") {
        const { source_id, days = 30 } = body;
        const { data: counts, error: countsError } = await adminClient.rpc(
          "get_admin_source_daily_counts",
          { p_source_id: source_id, p_days: days }
        );
        if (countsError) throw countsError;
        return new Response(
          JSON.stringify({ success: true, daily_counts: counts || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "ban_user") {
        const { user_id } = body;
        const { error: sourcesError } = await adminClient
          .from("sources")
          .update({ active: false })
          .eq("user_id", user_id);
        if (sourcesError) throw sourcesError;
        const { error: banError } = await adminClient.auth.admin.updateUserById(
          user_id,
          { ban_duration: "876000h" }
        );
        if (banError) throw banError;
        return new Response(
          JSON.stringify({ success: true, message: "User banned and all sources deactivated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "unban_user") {
        const { user_id } = body;
        const { error: unbanError } = await adminClient.auth.admin.updateUserById(
          user_id,
          { ban_duration: "none" }
        );
        if (unbanError) throw unbanError;
        return new Response(
          JSON.stringify({ success: true, message: "User unbanned" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET: fetch all admin data

    // 1. Sources
    const { data: sources, error: sourcesError } = await adminClient
      .from("sources")
      .select("*")
      .order("created_at", { ascending: false });
    if (sourcesError) throw sourcesError;

    // 2. User info
    const userIds = [...new Set((sources || []).map((s: any) => s.user_id))];
    const userMap: Record<string, { email: string; banned: boolean }> = {};
    for (const uid of userIds) {
      const { data: userData } = await adminClient.auth.admin.getUserById(uid as string);
      if (userData?.user) {
        userMap[uid as string] = {
          email: userData.user.email || "Unknown",
          banned: !!userData.user.banned_until && new Date(userData.user.banned_until) > new Date(),
        };
      }
    }

    // 3. Record counts per source
    const { data: counts } = await adminClient.rpc("get_source_record_counts_admin");
    const countMap: Record<string, number> = {};
    for (const c of counts || []) {
      countMap[c.source_id] = Number(c.record_count);
    }

    // 4. Total entries
    const { count: totalEntries } = await adminClient
      .from("data_entries")
      .select("*", { count: "exact", head: true });

    // 5. Growth trends (last 90 days)
    const { data: dailyCounts } = await adminClient.rpc("get_admin_daily_counts", { p_days: 90 });

    // 6. Per-user usage
    const { data: userUsage } = await adminClient.rpc("get_admin_user_usage");

    // Build enriched sources
    const enrichedSources = (sources || []).map((s: any) => ({
      ...s,
      user_email: userMap[s.user_id]?.email || "Unknown",
      actual_record_count: countMap[s.id] || 0,
    }));

    // Build user summary with usage data
    const usageMap: Record<string, any> = {};
    for (const u of userUsage || []) {
      usageMap[u.user_id] = u;
    }

    const userSummary = Object.entries(userMap).map(([uid, info]) => {
      const userSources = enrichedSources.filter((s: any) => s.user_id === uid);
      const totalRecords = userSources.reduce(
        (sum: number, s: any) => sum + s.actual_record_count, 0
      );
      const usage = usageMap[uid];
      return {
        user_id: uid,
        email: info.email,
        banned: info.banned,
        source_count: userSources.length,
        total_records: totalRecords,
        active_sources: userSources.filter((s: any) => s.active).length,
        earliest_entry: usage?.earliest_entry || null,
        latest_entry: usage?.latest_entry || null,
      };
    });

    return new Response(
      JSON.stringify({
        sources: enrichedSources,
        users: userSummary,
        total_entries: totalEntries || 0,
        total_sources: (sources || []).length,
        total_users: userIds.length,
        daily_counts: dailyCounts || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin data error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
