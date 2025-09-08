"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../../../../../../services/apiUsers";

const UserDetailsPage: React.FC = () => {
  const params = useParams();
  const userId = params.id as string;

  const {
    data: user,
    isPending,
    error,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            لم يتم العثور على المستخدم
          </h3>
          <Link
            href="/dashboard/users"
            className="text-primary-500 hover:text-primary-600"
          >
            العودة إلى قائمة المستخدمين
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-[25px] md:flex items-center justify-between">
        <h5 className="!mb-0">تفاصيل المستخدم</h5>

        <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <Link
              href="/dashboard"
              className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
            >
              <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
                home
              </i>
              رئيسية
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <Link
              href="/dashboard/users"
              className="transition-all hover:text-primary-500"
            >
              المستخدمين
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            تفاصيل المستخدم
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="lg:col-span-1">
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] text-center">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.full_name}
              </h6>
              <p className="text-gray-600 dark:text-gray-400">
                معرف المستخدم: {user.id?.slice(0, 8)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  الدور
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  }`}
                >
                  {user.role === "admin" ? "مدير" : "مستخدم"}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  تاريخ التسجيل
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(user.created_at as string).toLocaleDateString(
                    "ar-EG",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  آخر تحديث
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(user.updated_at as string).toLocaleDateString(
                    "ar-EG",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md mt-6">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                الإجراءات
              </h6>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/users"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <i className="material-symbols-outlined mr-2">arrow_back</i>
                العودة إلى المستخدمين
              </Link>
            </div>
          </div>
        </div>

        {/* User Details Form */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                معلومات المستخدم
              </h6>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم الكامل
                  </label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                    {user.full_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الرقم:
                  </label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                    {user.phone}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الدور
                  </label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                    {user.role === "admin" ? "مدير" : "مستخدم"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المحافظه
                  </label>

                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                    {user.city || "غير محدد"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Statistics */}
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md mt-6">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                إحصائيات المستخدم
              </h6>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  إجمالي الطلبات
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  الطلبات المكتملة
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  إجمالي المشتريات
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsPage;
