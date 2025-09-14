import { decode } from "base64-arraybuffer";
import supabase from "./supabase";

export interface Testemonial {
  name_ar: string;
  name_en: string;
  message_ar: string;
  message_en: string;
  image?: string;
  id?: string;
  created_at?: string;
}

export async function getTestemonial(
  page = 1,
  limit = 10,
  filters?: {
    search?: string;
    date?: string;
  }
): Promise<{ testimonials: Testemonial[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("testemonial").select("*", { count: "exact" });

  if (filters?.search) {
    query = query.or(
      `name_ar.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,message_ar.ilike.%${filters.search}%,message_en.ilike.%${filters.search}%`
    );
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

  const { data: testimonials, error, count } = await query.range(from, to);

  if (error) {
    console.error("خطأ في جلب التوصيات:", error.message);
    throw new Error("تعذر تحميل التوصيات");
  }

  return {
    testimonials: testimonials || [],
    total: count ?? 0,
  };
}

export async function getTestemonialById(id: string) {
  const { data, error } = await supabase
    .from("testemonial")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function CreateTestemonial(
  newTestimonial: Testemonial
): Promise<Testemonial[]> {
  const { data, error } = await supabase
    .from("testemonial")
    .insert([newTestimonial])
    .select();

  if (error) {
    console.log(error);
    throw new Error("تعذر إنشاء التوصية");
  }
  return data;
}

export async function updateTestemonial(
  id: string,
  updatedTestimonial: Partial<Testemonial>
) {
  const { data, error } = await supabase
    .from("testemonial")
    .update(updatedTestimonial)
    .eq("id", id)
    .select();

  if (error) {
    console.error("خطأ في تحديث التوصية:", error.message);
    throw new Error("تعذر تحديث التوصية");
  }

  return data;
}

export async function deleteTestemonial(id: string) {
  const { error } = await supabase.from("testemonial").delete().eq("id", id);

  if (error) {
    console.error("خطأ في حذف التوصية:", error.message);
    throw new Error("تعذر حذف التوصية");
  }

  return { success: true };
}

export async function uploadTestimonialImage(
  file: File | { base64: string; name: string },
  folder = "testimonials"
): Promise<string> {
  try {
    let fileData: string;
    let fileName: string;

    if (file instanceof File) {
      // Handle File object
      const arrayBuffer = await file.arrayBuffer();
      fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      fileName = file.name;
    } else {
      // Handle base64 object
      fileData = file.base64;
      fileName = file.name;
    }

    const { data, error } = await supabase.storage
      .from("testmonial-img")
      .upload(`${folder}/${Date.now()}-${fileName}`, decode(fileData), {
        contentType: "image/jpeg",
      });

    if (error) {
      console.error("خطأ في رفع الصورة:", error.message);
      throw new Error("تعذر رفع الصورة");
    }

    const { data: urlData } = supabase.storage
      .from("testmonial-img")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("خطأ في رفع الصورة:", error);
    throw new Error("تعذر رفع الصورة");
  }
}
