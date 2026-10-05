import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase server environment variables are not configured.");
    }
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requester }, error: requesterError } =
      await adminClient.auth.getUser(token);

    if (requesterError || !requester) {
      return new Response(JSON.stringify({ error: "Unauthorized request." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: requesterProfile } = await adminClient
      .from("users")
      .select("preferences")
      .eq("auth_id", requester.id)
      .maybeSingle();

    const role = (requesterProfile?.preferences as any)?.role;
    if (role !== "admin" && role !== "teacher") {
      return new Response(JSON.stringify({ error: "Admin or teacher access required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, name, phone, role: newRole, grade, school } = await req.json();

    if (!email || !password || !name || !newRole) {
      return new Response(JSON.stringify({ error: "email, password, name and role are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (newRole !== "teacher" && newRole !== "student") {
      return new Response(JSON.stringify({ error: "role must be teacher or student." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, mobile: phone, role: newRole },
    });

    if (createError) throw createError;

    const { error: profileError } = await adminClient.from("users").insert({
      auth_id: authData.user.id,
      email,
      name,
      mobile: phone || "",
      grade: grade || null,
      school: school || null,
      preferences: { role: newRole },
      is_active: true,
    });

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ success: true, userId: authData.user.id, email, role: newRole }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("create-user error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
