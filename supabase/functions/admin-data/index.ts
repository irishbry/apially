import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["bryan@rvnu.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = claimsData.claims.email as string;
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for admin queries
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get all sources
    const { data: sources, error: sourcesError } = await adminClient
      .from("sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (sourcesError) throw sourcesError;

    // Get unique user IDs
    const userIds = [...new Set((sources || []).map((s: any) => s.user_id))];

    // Fetch user emails from auth.users
    const userMap: Record<string, string> = {};
    for (const uid of userIds) {
      const { data: userData } = await adminClient.auth.admin.getUserById(
        uid as string
      );
      if (userData?.user?.email) {
        userMap[uid as string] = userData.user.email;
      }
    }

    // Get record counts per source
    const { data: counts } = await adminClient.rpc(
      "get_source_record_counts_admin"
    );
    const countMap: Record<string, number> = {};
    for (const c of counts || []) {
      countMap[c.source_id] = Number(c.record_count);
    }

    // Get total data entries count
    const { count: totalEntries } = await adminClient
      .from("data_entries")
      .select("*", { count: "exact", head: true });

    // Build response
    const enrichedSources = (sources || []).map((s: any) => ({
      ...s,
      user_email: userMap[s.user_id] || "Unknown",
      actual_record_count: countMap[s.id] || 0,
    }));

    // User summary
    const userSummary = Object.entries(userMap).map(([uid, email]) => {
      const userSources = enrichedSources.filter(
        (s: any) => s.user_id === uid
      );
      const totalRecords = userSources.reduce(
        (sum: number, s: any) => sum + s.actual_record_count,
        0
      );
      return {
        user_id: uid,
        email,
        source_count: userSources.length,
        total_records: totalRecords,
        active_sources: userSources.filter((s: any) => s.active).length,
      };
    });

    return new Response(
      JSON.stringify({
        sources: enrichedSources,
        users: userSummary,
        total_entries: totalEntries || 0,
        total_sources: (sources || []).length,
        total_users: userIds.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
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
