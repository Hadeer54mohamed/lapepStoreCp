"use client";

import React from "react";
import { ProfileTypes } from "./profileType";

interface ProfileIntroProps {
  profile?: ProfileTypes;
}

const ProfileInformation: React.FC<ProfileIntroProps> = ({ profile }) => {
  return (
    <>
  <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-xl shadow-md">
  {/* العنوان */}
  <div className="trezo-card-header pb-3 mb-5 border-b border-transparent">
    <h5 className="!mb-0 font-bold text-[#011957] dark:text-white text-lg relative inline-block">
      معلومات الملف الشخصي
      <span className="absolute bottom-[-8px] left-0 w-full h-[3px] rounded bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE]"></span>
    </h5>
  </div>

  {/* المحتوى */}
  <div className="trezo-card-content">
    <ul className="space-y-4">
      {/* رقم المستخدم */}
      <li className="flex items-center gap-2">
        <i className="material-symbols-outlined text-[#6043FD]">badge</i>
        <span className="text-[#011957] dark:text-gray-300">
          رقم المستخدم الخاص:
        </span>
        <span className="text-[#6043FD] dark:text-[#BA6FEE] font-semibold">
          {profile?.user_id || "-"}
        </span>
      </li>

      {/* الاسم الكامل */}
      <li className="flex items-center gap-2">
        <i className="material-symbols-outlined text-[#9861FB]">person</i>
        <span className="text-[#011957] dark:text-gray-300">
          الاسم الكامل:
        </span>
        <span className="text-[#6043FD] dark:text-[#BA6FEE] font-semibold">
          {profile?.full_name || "-"}
        </span>
      </li>

      {/* البريد الإلكتروني */}
      <li className="flex items-center gap-2">
        <i className="material-symbols-outlined text-[#BA6FEE]">mail</i>
        <span className="text-[#011957] dark:text-gray-300">
          البريد الإلكتروني:
        </span>
        <span className="text-[#6043FD] dark:text-[#9861FB] font-semibold">
          {profile?.email || "-"}
        </span>
      </li>

      {/* الدور */}
      <li className="flex items-center gap-2">
        <i className="material-symbols-outlined text-[#6043FD]">work</i>
        <span className="text-[#011957] dark:text-gray-300">
          الدور:
        </span>
        <span className="text-[#6043FD] dark:text-[#BA6FEE] font-semibold">
          {profile?.job_title || "-"}
        </span>
      </li>

      {/* الموقع */}
      <li className="flex items-center gap-2">
        <i className="material-symbols-outlined text-[#9861FB]">location_on</i>
        <span className="text-[#011957] dark:text-gray-300">
          الموقع:
        </span>
        <span className="text-[#6043FD] dark:text-[#BA6FEE] font-semibold">
          {profile?.address || "-"}
        </span>
      </li>

      {/* تاريخ الانضمام */}
      <li className="flex items-center gap-2">
        <i className="material-symbols-outlined text-[#BA6FEE]">calendar_month</i>
        <span className="text-[#011957] dark:text-gray-300">
          تاريخ الانضمام:
        </span>
        <span className="text-[#6043FD] dark:text-[#9861FB] font-semibold">
          {profile?.joined_at
            ? new Date(profile.joined_at).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-"}
        </span>
      </li>
    </ul>
  </div>
</div>

 </>
  );
};

export default ProfileInformation;
