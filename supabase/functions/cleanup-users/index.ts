import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can clean up users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action } = await req.json();
    let result = { deletedUsers: 0, details: [] as string[] };

    if (action === "cleanup_incomplete") {
      // Find users without roles
      const { data: allProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email");

      const { data: allRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id");

      const usersWithRoles = new Set(allRoles?.map(r => r.user_id) || []);
      
      // Find profiles without roles (incomplete registrations)
      const incompleteUsers = (allProfiles || []).filter(p => !usersWithRoles.has(p.id));

      for (const user of incompleteUsers) {
        console.log(`Deleting incomplete user: ${user.email}`);
        
        // Delete from auth.users (will cascade to profiles due to trigger)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (!deleteError) {
          result.deletedUsers++;
          result.details.push(`Deleted: ${user.email}`);
        } else {
          console.error(`Error deleting user ${user.email}:`, deleteError);
        }
      }
    } else if (action === "delete_user") {
      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete the user completely
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      result.deletedUsers = 1;
      result.details.push(`User ${userId} deleted`);
    }

    console.log("Cleanup result:", result);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
