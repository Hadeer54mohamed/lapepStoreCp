import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Define the profile data type
interface AdminProfileData {
  full_name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  address?: string;
  about?: string;
  image_url?: string;
}

// Check environment variables
export function checkEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    supabaseUrl: !!supabaseUrl,
    supabaseKey: !!supabaseKey,
    allSet: !!(supabaseUrl && supabaseKey),
  };
}

// Test function to verify Supabase connection and table access
export async function testSupabaseConnection() {
  try {
    // First check environment variables
    const envCheck = checkEnvironmentVariables();
    if (!envCheck.allSet) {
      return {
        success: false,
        error: `Environment variables not set: URL=${envCheck.supabaseUrl}, KEY=${envCheck.supabaseKey}`,
      };
    }

    const supabase = createClientComponentClient();

    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase connection test failed:", error);

      // Check for specific error types
      if (error.code === "PGRST116") {
        return {
          success: true,
          data: [],
          message: "Table exists but no data found",
        };
      }

      if (error.code === "406") {
        return {
          success: false,
          error:
            "406 Not Acceptable - Check table permissions and RLS policies",
        };
      }

      return { success: false, error: error.message };
    }

    console.log("Supabase connection test successful");
    return { success: true, data };
  } catch (error) {
    console.error("Supabase connection test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentUser() {
  const supabase = createClientComponentClient();
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) return null;

  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  return data?.user;
}

export async function getAdminProfileById(userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no profile found, return null instead of throwing error
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

export async function updateAdminProfile(
  userId: string,
  profileData: AdminProfileData
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from("admin_profiles")
    .update(profileData)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function createAdminProfile(
  userId: string,
  profileData: AdminProfileData
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from("admin_profiles")
    .insert({
      user_id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function logout() {
  const supabase = createClientComponentClient();
  const { error } = await supabase.auth.signOut();

  if (error) throw new Error(error.message);
}
