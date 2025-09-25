"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();

  const handleChangePassword = async () => {
    setMessage("");
    setLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("يرجى ملء جميع الحقول.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("كلمة السر الجديدة غير متطابقة.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClientComponentClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        setMessage("لم يتم العثور على المستخدم.");
        setLoading(false);
        return;
      }

      // تسجيل الدخول لتأكيد كلمة السر الحالية
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setMessage("كلمة السر الحالية غير صحيحة.");
        setLoading(false);
        return;
      }

      // تحديث كلمة السر
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setMessage("حدث خطأ أثناء تحديث كلمة السر.");
      } else {
        setMessage("تم تحديث كلمة السر بنجاح.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.push("/dashboard/my-profile");
      }
    } catch (err) {
      setMessage("حدث خطأ غير متوقع.");
      console.error("Error changing password:", err);
    }

    setLoading(false);
  };

  return (
    <>
<form className="gap-[25px]">
  <div className="xl:col-span-3 2xl:col-span-2">
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* Header */}
      <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
        <div className="trezo-card-title">
          <h5 className="!mb-0 text-[#011957] dark:text-white">
            تغيير الرقم السري
          </h5>
        </div>
      </div>

      {/* Content */}
      <div className="trezo-card-content">
        <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
          {/* Current Password */}
          <div className="mb-[20px] sm:mb-0 relative" id="passwordHideShow">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              الرقم السري الحالي
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الحالية"
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] 
                         bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
          </div>

          {/* New Password */}
          <div className="mb-[20px] sm:mb-0 relative" id="passwordHideShow2">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              الرقم السري الجديد
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة مرور جديدة"
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] 
                         bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
          </div>

          {/* Confirm Password */}
          <div className="sm:col-span-2 mb-[20px] sm:mb-0 relative" id="passwordHideShow3">
            <label className="mb-[10px] block text-sm font-medium text-[#011957] dark:text-gray-300">
              تأكيد الرقم السري
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              className="h-[50px] rounded-md text-black dark:text-white border border-[#BA6FEE] 
                         bg-[#F9F6FF] dark:bg-[#172036] px-[15px] block w-full outline-0 transition-all"
            />
          </div>
        </div>

        {/* Error Message */}
        {message && (
          <p className="text-red-500 text-sm mt-2">{message}</p>
        )}

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
            type="button"
            onClick={handleChangePassword}
            disabled={loading}
            className="font-medium transition-all rounded-md py-[10px] px-[20px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              <i className="material-symbols-outlined text-lg">
                {loading ? "sync" : "check"}
              </i>
              {loading ? "جاري التحديث..." : "تأكيد"}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</form>

 </>
  );
};

export default ChangePasswordForm;
