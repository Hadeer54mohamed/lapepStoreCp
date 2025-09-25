"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/components/Social/SettingsForm/lib/validations/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type SignUpData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
  };

  const supabase = createClientComponentClient();

  const submit = async (data: SignUpData) => {
    try {
      // 1. تسجيل المستخدم
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("فشل في الحصول على معرف المستخدم.");

      // 2. رفع الصورة إن وجدت
      let imageUrl = "";
      if (profilePicture) {
        const fileExt = profilePicture.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, profilePicture);

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // 3. حفظ البيانات في جدول admin_profiles
      const { error: profileError } = await supabase
        .from("admin_profiles")
        .insert({
          user_id: userId,
          full_name: data.full_name ?? "",
          email: data.email,
          phone: data.phone,
          job_title: data.job_title ?? "",
          address: data.address ?? "",
          about: data.about ?? "",
          image_url: imageUrl,
        });

      if (profileError) throw new Error(profileError.message);

      toast.success("تم إنشاء الحساب بنجاح");
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`فشل التسجيل: ${error.message}`);
      } else {
        toast.error("فشل التسجيل: حدث خطأ غير متوقع");
      }
    }
  };

  return (
    <>
   <form onSubmit={handleSubmit(submit)}>
  <div className="gap-6">
    <div className="xl:col-span-3 2xl:col-span-2">
      <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-xl shadow-md">
        {/* العنوان */}
        <div className="trezo-card-header mb-6 flex items-center justify-between border-b border-gray-200 dark:border-[#172036] pb-3">
          <h5 className="!mb-0 text-lg font-bold text-[#011957] dark:text-white">
            تسجيل حساب جديد
          </h5>
        </div>

        {/* المحتوى */}
        <div className="trezo-card-content">
          <div className="sm:grid sm:grid-cols-2 sm:gap-6">
            {/* Email */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="example@email.com"
                className="input-style"
              />
              {errors.email && (
                <p className="text-[#E10E0E] text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                كلمة المرور *
              </label>
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="input-style"
              />
              {errors.password && (
                <p className="text-[#E10E0E] text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                رقم الهاتف *
              </label>
              <input
                type="text"
                {...register("phone")}
                placeholder="+20 100 000 0000"
                className="input-style"
              />
              {errors.phone && (
                <p className="text-[#E10E0E] text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                الاسم الكامل *
              </label>
              <input
                type="text"
                {...register("full_name")}
                placeholder="أدخل اسمك الكامل"
                className="input-style"
              />
            </div>

            {/* Job Title */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                الوظيفة
              </label>
              <input
                type="text"
                {...register("job_title")}
                placeholder="مثال: مطور ويب"
                className="input-style"
              />
            </div>

            {/* Address */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                العنوان
              </label>
              <input
                type="text"
                {...register("address")}
                placeholder="أدخل عنوانك"
                className="input-style"
              />
            </div>

            {/* About */}
            <div className="sm:col-span-2 mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                عنك
              </label>
              <textarea
                {...register("about")}
                placeholder="اكتب نبذة عن نفسك"
                className="input-style h-[140px] p-4 resize-none"
              ></textarea>
            </div>

            {/* Profile Picture */}
            <div className="mb-5 sm:mb-0">
              <label className="mb-2 block font-medium text-[#011957] dark:text-gray-200">
                صورة الملف الشخصي
              </label>
              <div className="relative flex items-center justify-center overflow-hidden rounded-md py-12 px-5 border-2 border-dashed border-[#9861FB] hover:border-[#6043FD] transition cursor-pointer bg-white dark:bg-[#0c1427]">
                <div className="flex flex-col items-center justify-center text-center">
                  <i className="ri-upload-2-line text-2xl text-[#6043FD] mb-2"></i>
                  <p className="leading-[1.5] text-sm text-[#011957] dark:text-gray-300">
                    <strong className="text-[#6043FD]">انقر للتحميل</strong>
                    <br /> ملفك هنا
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 z-[1] opacity-0 cursor-pointer"
                  onChange={handleProfilePictureChange}
                />
              </div>

              {profilePicture && (
                <div className="mt-3">
                  <div className="relative w-[80px] h-[80px]">
                    <Image
                      src={URL.createObjectURL(profilePicture)}
                      alt="profile-preview"
                      width={80}
                      height={80}
                      className="rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-[-5px] right-[-5px] bg-[#E10E0E] text-white w-[22px] h-[22px] flex items-center justify-center rounded-full text-xs"
                      onClick={handleRemoveProfilePicture}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* زر الإنشاء */}
          <div className="mt-6 sm:mt-8">
            <button
              type="submit"
              className="font-medium inline-block rounded-md py-3 px-6 w-full sm:w-auto text-white bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE] hover:opacity-90 transition-all"
            >
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</form>


    </>
  );
}
