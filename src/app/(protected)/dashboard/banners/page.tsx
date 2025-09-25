"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useBanners, useDeleteBanner } from "../../../../hooks/useBanners";

export default function BannersPage() {
  const { data: banners = [], isLoading } = useBanners();
  const deleteBannerMutation = useDeleteBanner();

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البانر؟")) {
      return;
    }

    try {
      await deleteBannerMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("حدث خطأ أثناء حذف البانر");
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>إدارة البانرات - جاري التحميل</title>
          <meta name="description" content="إدارة البانرات" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main
          className="flex items-center justify-center min-h-screen"
          dir="rtl"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              جاري تحميل البانرات...
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
    <Head>
      <title>إدارة البانرات</title>
      <meta name="description" content="إدارة البانرات" />
      <meta name="robots" content="noindex, nofollow" />
    </Head>
  
    <main className="p-6 space-y-6" dir="rtl">
      {/* Title + Breadcrumb */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
          إدارة البانرات
        </h5>
  
        <ol className="breadcrumb flex gap-2 mt-2 md:mt-0 text-sm text-gray-600 dark:text-gray-300">
          <li>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[#6043FD] hover:text-[#9861FB] transition"
            >
              <i className="material-symbols-outlined !text-lg mr-1">home</i>
              رئيسية
            </Link>
          </li>
          <li>/</li>
          <li className="text-primary-500">البانرات</li>
        </ol>
      </div>
  
      {/* Banners List */}
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-6 p-5 rounded-lg shadow-md">
        {/* Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h5 className="!mb-0 text-lg font-semibold text-[#011957] dark:text-white">
            قائمة البانرات ({banners.length}/3)
          </h5>
          {banners.length >= 3 ? (
            <button
              disabled
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gray-400 text-white font-medium cursor-not-allowed opacity-50"
            >
              <i className="material-symbols-outlined !text-[22px]">add</i>
              <span>تم الوصول للحد الأقصى</span>
            </button>
          ) : (
            <Link
              href="/dashboard/banners/create"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium hover:from-[#5033e0] hover:to-[#8750e0] transition shadow"
            >
              <i className="material-symbols-outlined !text-[22px]">add</i>
              <span>إضافة بانر جديد</span>
            </Link>
          )}
        </div>
  
        {banners.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#6043FD] mb-4">
              <i className="material-symbols-outlined text-6xl">image</i>
            </div>
            <h3 className="text-lg font-medium text-[#011957] dark:text-white mb-2">
              لا توجد بانرات
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              ابدأ بإنشاء أول بانر لك
            </p>
            <Link
              href="/dashboard/banners/create"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium hover:from-[#5033e0] hover:to-[#8750e0] transition shadow"
            >
              <i className="material-symbols-outlined !text-[22px]">add</i>
              <span>إضافة بانر جديد</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white dark:bg-[#15203c] rounded-lg p-4 border border-[#BA6FEE] shadow-md hover:shadow-lg transition"
              >
                {/* Banner Image */}
                <div className="mb-4">
                  {banner.image ? (
                    <Image
                      src={banner.image}
                      alt="Banner"
                      width={400}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-[#F3EBFF] dark:bg-[#1e1a3c] rounded-lg flex items-center justify-center border-2 border-dashed border-[#BA6FEE]">
                      <i className="material-symbols-outlined text-[#6043FD] text-4xl">
                        image
                      </i>
                    </div>
                  )}
                </div>
  
                {/* Banner Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/banners/${banner.id}/edit`}
                    className="flex-1 bg-[#6043FD] hover:bg-[#5033e0] text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200 text-center font-medium"
                  >
                    <i className="material-symbols-outlined text-sm">edit</i>
                    تعديل
                  </Link>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    disabled={deleteBannerMutation.isPending}
                    className="flex-1 bg-[#E10E0E] hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {deleteBannerMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      <>
                        <i className="material-symbols-outlined text-sm">delete</i>
                        حذف
                      </>
                    )}
                  </button>
                </div>
  
                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-[#BA6FEE]">
                  <p className="text-xs text-[#011957] dark:text-white">
                    تم الإنشاء:{" "}
                    {new Date(banner.created_at).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  </>
  
  
  );
}
