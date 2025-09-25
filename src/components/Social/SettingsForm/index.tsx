"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useAdminProfile } from "@/components/MyProfile/useAdminProfile";
import { useUser } from "@/components/Authentication/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  updateAdminProfile,
  createAdminProfile,
} from "../../../../services/apiauth";
import { profileSchema } from "./lib/validations/schema";
import { z } from "zod";

const SettingsForm: React.FC = () => {
  const { data: profile } = useAdminProfile();
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحديث قيم الفورم عندما تتغير بيانات profile
  useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  const handleProfilePictureChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setProfilePicture(event.target.files[0]);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const submit = async (formData: z.infer<typeof profileSchema>) => {
    try {
      setIsSubmitting(true);

      // Ensure we have a valid user_id
      const userId = user?.id;
      if (!userId) {
        throw new Error("User ID is required for profile update");
      }

      let image_url = profile?.image_url;

      if (profilePicture) {
        image_url = await uploadImage(profilePicture);
      }

      const profileData = {
        ...formData,
        image_url,
      };

      let updatedProfile;

      if (profile) {
        // Update existing profile
        updatedProfile = await updateAdminProfile(userId, profileData);
      } else {
        // Create new profile
        updatedProfile = await createAdminProfile(userId, profileData);
      }

      console.log("Profile updated successfully:", updatedProfile);

      router.refresh();
      router.push("/dashboard/my-profile");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Update error:", error.message);
        // You might want to show a toast notification here
        alert(`Error: ${error.message}`);
      } else {
        console.error("Unknown error", error);
        alert("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading user data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(submit)}>
      <div className="gap-[25px]">
  <div className="xl:col-span-3 2xl:col-span-2">
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* Header */}
      <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
        <div className="trezo-card-title">
          <h5 className="!mb-0 text-[#011957] dark:text-white">
            إعدادات الملف الشخصي
          </h5>
        </div>
      </div>

      {/* Content */}
      <div className="trezo-card-content">
        <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
          {/* Full Name */}
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="full_name"
              {...register("full_name")}
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              عنوان البريد الإلكتروني
            </label>
            <input
              type="text"
              id="email"
              {...register("email")}
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              رقم الهاتف
            </label>
            <input
              type="text"
              id="phone"
              {...register("phone")}
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Job Title */}
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              الوظيفة
            </label>
            <input
              type="text"
              id="job_title"
              {...register("job_title")}
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
            {errors.job_title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.job_title.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              العنوان
            </label>
            <input
              type="text"
              id="address"
              {...register("address")}
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* About */}
          <div className="sm:col-span-2 mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              عنك
            </label>
            <textarea
              id="about"
              {...register("about")}
              className="h-[120px] rounded-md text-black dark:text-white border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036] p-[15px] block w-full outline-0 transition-all"
            ></textarea>
            {errors.about && (
              <p className="text-red-500 text-sm mt-1">
                {errors.about.message}
              </p>
            )}
          </div>

          {/* Profile Picture */}
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              صورة الملف الشخصي
            </label>
            <div id="fileUploader">
              <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[60px] px-[20px] border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036]">
                <div className="flex items-center justify-center">
                  <div className="w-[35px] h-[35px] border border-[#BA6FEE] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-[12px] rtl:ml-[12px]">
                    <i className="ri-upload-2-line"></i>
                  </div>
                  <p className="leading-[1.5] text-[#011957] dark:text-gray-300">
                    <strong className="text-[#011957] dark:text-white">
                      انقر للتحميل
                    </strong>
                    <br /> ملفك هنا
                  </p>
                </div>
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                  onChange={handleProfilePictureChange}
                />
              </div>

              {(profilePicture || profile?.image_url) && (
                <div className="mt-[10px]">
                  <div className="relative w-[80px] h-[80px]">
                    <Image
                      src={
                        profilePicture
                          ? URL.createObjectURL(profilePicture)
                          : profile?.image_url || ""
                      }
                      alt="profile-preview"
                      width={80}
                      height={80}
                      className="rounded-md"
                    />
                    {profilePicture && (
                      <button
                        type="button"
                        className="absolute top-[-5px] right-[-5px] bg-danger-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs rtl:right-auto rtl:left-[-5px]"
                        onClick={handleRemoveProfilePicture}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-[20px] sm:mt-[25px] flex gap-3">
        <button
            type="button"
            onClick={() => router.push("/dashboard/my-profile")}
            className="font-medium transition-all rounded-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
          >
            إلغاء
          </button>

          <button
            type="submit"
            className="font-medium transition-all rounded-md py-[10px] px-[20px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            <span className="inline-flex items-center gap-2">
              <i className="material-symbols-outlined">
                {isSubmitting ? "hourglass_empty" : "add"}
              </i>
              {isSubmitting ? "جاري الحفظ..." : "حفظ المعلومات"}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

      </form>
    </>
  );
};

export default SettingsForm;
