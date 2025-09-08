import supabase from "./supabase";

export interface User {
  id?: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  is_active?: boolean;
  phone?: string;
  city?: string;
}

export async function getUsers(
  page = 1,
  limit = 10,
  filters?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    date?: string;
  }
): Promise<{ users: User[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" });

  if (filters?.search) {
    query = query.or(`id.ilike.%${filters.search}%`);
  }

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  if (filters?.date) {
    const now = new Date();
    const startDate = new Date();

    switch (filters.date) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  query = query.order("created_at", { ascending: false });

  const { data: users, error, count } = await query.range(from, to);

  if (error) {
    console.error("خطأ في جلب المستخدمين:", error.message);
    throw new Error("تعذر تحميل المستخدمين");
  }

  console.log("Debug - Raw users data from getUsers:", users);
  console.log("Debug - Users count:", count);

  return {
    users: users || [],
    total: count ?? 0,
  };
}

export async function getUserById(id: string): Promise<User> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("خطأ في جلب المستخدم:", error.message);
    throw new Error("تعذر تحميل المستخدم");
  }

  return data;
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("خطأ في تحديث المستخدم:", error.message);
    throw new Error("تعذر تحديث المستخدم");
  }

  return data;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    console.error("خطأ في حذف المستخدم:", error.message);
    throw new Error("تعذر حذف المستخدم");
  }
}

export async function toggleUserStatus(
  id: string,
  is_active: boolean
): Promise<User> {
  // For now, we'll just update the updated_at timestamp since is_active column doesn't exist
  const { data, error } = await supabase
    .from("profiles")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("خطأ في تحديث حالة المستخدم:", error.message);
    throw new Error("تعذر تحديث حالة المستخدم");
  }

  return data;
}

export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  admins: number;
  users: number;
}> {
  // First, let's check what columns exist in the profiles table
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.error("خطأ في جلب إحصائيات المستخدمين:", error.message);
    throw new Error("تعذر تحميل إحصائيات المستخدمين");
  }

  console.log("Debug - Raw profiles data from getUserStats:", data);
  console.log("Debug - Sample profile structure:", data?.[0]);

  // For now, let's use a simplified approach since we don't know the exact structure
  const stats = {
    total: data?.length || 0,
    active: data?.length || 0, // Assume all users are active for now
    inactive: 0, // No inactive users for now
    admins: data?.filter((user) => user.role === "admin").length || 0,
    users: data?.filter((user) => user.role === "user").length || 0,
  };

  console.log("Debug - Calculated user stats:", stats);
  return stats;
}

// Function to check the structure of the profiles table
export async function checkProfilesTableStructure() {
  console.log("=== CHECKING PROFILES TABLE STRUCTURE ===");

  try {
    // Get a sample profile to see the structure
    const { data: sampleProfile, error: sampleError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .single();

    console.log("Sample profile structure:", sampleProfile);
    console.log("Sample profile error:", sampleError);

    if (sampleProfile) {
      console.log("Available columns:", Object.keys(sampleProfile));
    }

    // Get all profiles to see the data
    const { data: allProfiles, error: allError } = await supabase
      .from("profiles")
      .select("*");

    console.log("All profiles count:", allProfiles?.length);
    console.log("All profiles error:", allError);

    return { sampleProfile, allProfiles };
  } catch (error) {
    console.error("Error checking profiles table structure:", error);
    return null;
  }
}
