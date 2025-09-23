import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
  deleteBannerImage,
  UpdateBannerData,
} from "../../services/apiBanners";

// Query keys
export const bannerKeys = {
  all: ["banners"] as const,
  lists: () => [...bannerKeys.all, "list"] as const,
  list: (filters: string) => [...bannerKeys.lists(), { filters }] as const,
  details: () => [...bannerKeys.all, "detail"] as const,
  detail: (id: number) => [...bannerKeys.details(), id] as const,
};

// Get all banners
export const useBanners = () => {
  return useQuery({
    queryKey: bannerKeys.lists(),
    queryFn: getBanners,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get banner by ID
export const useBanner = (id: number) => {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => getBannerById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create banner mutation
export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBanner,
    onSuccess: () => {
      // Invalidate and refetch banners list
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
    },
    onError: (error) => {
      console.error("Error creating banner:", error);
    },
  });
};

// Update banner mutation
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBannerData }) =>
      updateBanner(id, data),
    onSuccess: (updatedBanner) => {
      // Update the specific banner in cache
      queryClient.setQueryData(
        bannerKeys.detail(updatedBanner.id),
        updatedBanner
      );
      // Invalidate banners list to ensure consistency
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
    },
    onError: (error) => {
      console.error("Error updating banner:", error);
    },
  });
};

// Delete banner mutation
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBanner,
    onSuccess: (_, deletedId) => {
      // Remove the banner from cache
      queryClient.removeQueries({ queryKey: bannerKeys.detail(deletedId) });
      // Invalidate banners list
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
    },
    onError: (error) => {
      console.error("Error deleting banner:", error);
    },
  });
};

// Upload banner image mutation
export const useUploadBannerImage = () => {
  return useMutation({
    mutationFn: uploadBannerImage,
    onError: (error) => {
      console.error("Error uploading banner image:", error);
    },
  });
};

// Delete banner image mutation
export const useDeleteBannerImage = () => {
  return useMutation({
    mutationFn: deleteBannerImage,
    onError: (error) => {
      console.error("Error deleting banner image:", error);
    },
  });
};
