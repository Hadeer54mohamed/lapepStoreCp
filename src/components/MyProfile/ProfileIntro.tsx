"use client";

import Image from "next/image";
import { ProfileTypes } from "./profileType";

interface ProfileIntroProps {
  profile?: ProfileTypes;
}

const ProfileIntro: React.FC<ProfileIntroProps> = ({ profile }) => {
  return (
    <>
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md text-center shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between border-b border-[#BA6FEE]/30 pb-[10px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 text-[#011957] dark:text-white font-semibold text-lg">
            الملف الشخصي
          </h5>
        </div>
      </div>
  
      {/* Content */}
      <div className="trezo-card-content">
        <div className="flex items-center justify-center">
          <Image
            src={profile?.image_url || "/default-avatar.png"}
            alt="user-image"
            className="rounded-full w-[75px] h-[75px] object-cover border-2 border-[#BA6FEE]"
            width={75}
            height={75}
          />
          <div className="ltr:ml-[15px] rtl:mr-[15px] text-left rtl:text-right">
            <span className="block text-black dark:text-white text-[17px] font-semibold">
              {profile?.full_name?.split(" ")[0] || "مستخدم"}
            </span>
            <span className="block mt-px text-sm text-gray-600 dark:text-gray-400">
              {profile?.job_title || "بدون وظيفة"}
            </span>
          </div>
        </div>
  
        {profile?.about && (
          <div className="mt-[20px]">
            <span className="text-black dark:text-white font-semibold block mb-[5px]">
              عني
            </span>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
              {profile.about}
            </p>
          </div>
        )}
      </div>
    </div>
  </>
  
  );
};

export default ProfileIntro;
