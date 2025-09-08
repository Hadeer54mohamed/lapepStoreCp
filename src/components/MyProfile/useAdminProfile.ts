// hooks/useAdminProfile.ts
import { useQuery } from "@tanstack/react-query";

import { useUser } from "@/components/Authentication/useUser";
import { getAdminProfileById } from "../../../services/apiauth";

export function useAdminProfile() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["adminProfile", user?.id],
    queryFn: () => getAdminProfileById(user!.id),
    enabled: !!user?.id, // ما يشتغلش غير لما يكون فيه user
    retry: (failureCount, error) => {
      // Don't retry if it's a "not found" error (profile doesn't exist)
      if (
        error instanceof Error &&
        error.message.includes("User ID is required")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
