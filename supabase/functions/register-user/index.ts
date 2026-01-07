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
    
    // Create admin client with service role key
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
        JSON.stringify({ error: "Only admins can register new users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, fullName, role, courseIds } = await req.json();

    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Registering new user: ${email} with role: ${role}`);

    // Create user using admin API (doesn't affect current session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newUser.user) {
      console.log(`User created with ID: ${newUser.user.id}`);

      // Update the profile with the full name
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", newUser.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      // Update user role
      const { error: roleUpdateError } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUser.user.id);

      if (roleUpdateError) {
        console.error("Error updating role:", roleUpdateError);
      }

      // Create appropriate record based on role
      if (role === "student") {
        const studentNumber = `STU${Date.now().toString().slice(-8)}`;
        const { data: studentData, error: studentError } = await supabaseAdmin
          .from("students")
          .insert({
            user_id: newUser.user.id,
            student_number: studentNumber,
            registered_by: requestingUser.id,
          })
          .select('id')
          .single();

        if (studentError) {
          console.error("Error creating student record:", studentError);
        } else if (studentData && courseIds && courseIds.length > 0) {
          // Enroll student in selected courses
          console.log(`Enrolling student in ${courseIds.length} courses`);
          const enrollments = courseIds.map((courseId: string) => ({
            student_id: studentData.id,
            course_id: courseId,
            status: 'active',
          }));

          const { error: enrollError } = await supabaseAdmin
            .from("student_courses")
            .insert(enrollments);

          if (enrollError) {
            console.error("Error enrolling student in courses:", enrollError);
          }
        }
      } else if (role === "staff" || role === "instructor") {
        const { data: staffData, error: staffError } = await supabaseAdmin
          .from("staff")
          .insert({
            user_id: newUser.user.id,
            position: role === "instructor" ? "Instructor" : "Staff",
            department: role === "instructor" ? "Academic" : undefined,
          })
          .select('id')
          .single();

        if (staffError) {
          console.error("Error creating staff record:", staffError);
        } else if (staffData && role === "instructor" && courseIds && courseIds.length > 0) {
          // Assign instructor to selected courses
          console.log(`Assigning instructor to ${courseIds.length} courses`);
          for (const courseId of courseIds) {
            const { error: courseUpdateError } = await supabaseAdmin
              .from("courses")
              .update({ instructor_id: staffData.id })
              .eq("id", courseId);

            if (courseUpdateError) {
              console.error(`Error assigning instructor to course ${courseId}:`, courseUpdateError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: newUser.user?.id, email: newUser.user?.email } 
      }),
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
