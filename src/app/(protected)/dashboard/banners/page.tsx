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
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <section className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              إدارة البانرات
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة البانرات الخاصة بالموقع (حد أقصى 3 بانرات)
            </p>
          </section>
          {banners.length >= 3 ? (
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-not-allowed opacity-50"
            >
              <i className="material-symbols-outlined">add</i>
              تم الوصول للحد الأقصى
            </button>
          ) : (
            <Link
              href="/dashboard/banners/create"
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <i className="material-symbols-outlined">add</i>
              إضافة بانر جديد
            </Link>
          )}
        </header>

        {/* Banners List */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-right">
              قائمة البانرات ({banners.length}/3)
            </h2>

            {banners.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <i className="material-symbols-outlined text-6xl">image</i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد بانرات
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  ابدأ بإنشاء أول بانر لك
                </p>
                <Link
                  href="/dashboard/banners/create"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <i className="material-symbols-outlined">add</i>
                  إضافة بانر جديد
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
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
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <i className="material-symbols-outlined text-gray-400 text-4xl">
                            image
                          </i>
                        </div>
                      )}
                    </div>

                    {/* Banner Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/banners/${banner.id}/edit`}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200 text-center"
                      >
                        <i className="material-symbols-outlined text-sm">
                          edit
                        </i>
                        تعديل
                      </Link>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        disabled={deleteBannerMutation.isPending}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteBannerMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                        ) : (
                          <>
                            <i className="material-symbols-outlined text-sm">
                              delete
                            </i>
                            حذف
                          </>
                        )}
                      </button>
                    </div>

                    {/* Created Date */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        تم الإنشاء:{" "}
                        {new Date(banner.created_at).toLocaleDateString(
                          "ar-EG"
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
