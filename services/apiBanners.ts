import supabase from "./supabase";

export interface Banner {
  id: number;
  created_at: string;
  desc_ar: string | null;
  desc_en: string | null;
  image: string | null;
}

export interface CreateBannerData {
  desc_ar?: string;
  desc_en?: string;
  image?: string;
}

export interface UpdateBannerData {
  desc_ar?: string;
  desc_en?: string;
  image?: string;
}

// Get all banners
export const getBanners = async (): Promise<Banner[]> => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching banners:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getBanners:", error);
    throw error;
  }
};

// Get banner by ID
export const getBannerById = async (id: number): Promise<Banner | null> => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching banner:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getBannerById:", error);
    throw error;
  }
};

// Create new banner
export const createBanner = async (
  bannerData: CreateBannerData
): Promise<Banner> => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .insert([bannerData])
      .select()
      .single();

    if (error) {
      console.error("Error creating banner:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createBanner:", error);
    throw error;
  }
};

// Update banner
export const updateBanner = async (
  id: number,
  bannerData: UpdateBannerData
): Promise<Banner> => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .update(bannerData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating banner:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateBanner:", error);
    throw error;
  }
};

// Delete banner
export const deleteBanner = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      console.error("Error deleting banner:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteBanner:", error);
    throw error;
  }
};

// Upload image to Supabase Storage
export const uploadBannerImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { data, error } = await supabase.storage
      .from("banners-images")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("banners-images").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadBannerImage:", error);
    throw error;
  }
};

// Delete image from Supabase Storage
export const deleteBannerImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `banners/${fileName}`;

    const { error } = await supabase.storage
      .from("banners-images")
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteBannerImage:", error);
    throw error;
  }
};
